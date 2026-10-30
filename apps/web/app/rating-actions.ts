"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { friendlyError } from "@/lib/db-errors";
import { dishHref } from "@/lib/dishes";
import type { Vote } from "@/lib/ratings";
import { getStanding, type Standing } from "@/lib/rankings";
import { ratingSchema } from "@/lib/validation";

// What saving told us: where the dish stood before and where it stands now, for the "what changed" panel.
export type Posted = { score: number; edited: boolean; dish: string; place: string; href: string; before: Standing | null; after: Standing | null; atHome: boolean };
export type SaveRatingState = { error?: string; posted?: Posted };

// Create or update the viewer's one rating of a dish. Photos, when sent, replace the old set.
export async function saveRating(_: SaveRatingState, formData: FormData): Promise<SaveRatingState> {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  const dishId = String(formData.get("dish_id") ?? "");
  const parsed = ratingSchema.safeParse({ score: formData.get("score"), take: String(formData.get("take") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const photosSent = formData.get("photos_sent") === "1";
  const paths = formData.getAll("photo").map(String).filter((p) => p.startsWith(`${userId}/`)).slice(0, 4);

  const before = await getStanding(supabase, dishId);
  const { data: existing } = await supabase.from("ratings").select("id").eq("dish_id", dishId).eq("user_id", userId).maybeSingle();
  const { data: saved, error } = existing
    ? await supabase.from("ratings").update(parsed.data).eq("id", existing.id).select("id").single()
    : await supabase.from("ratings").insert({ dish_id: dishId, ...parsed.data }).select("id").single();
  if (error || !saved) return { error: friendlyError(error, "Couldn't save that just now. Try again in a moment.") };
  // You've had it now: it comes off your "Want to try" list. Best effort; RLS limits this to your own saves.
  await supabase.from("saves").delete().eq("dish_id", dishId);

  if (photosSent) {
    const { data: old } = await supabase.from("rating_photos").select("path").eq("rating_id", saved.id);
    await supabase.from("rating_photos").delete().eq("rating_id", saved.id);
    const gone = (old ?? []).map((p) => p.path).filter((p) => !paths.includes(p));
    if (gone.length) await supabase.storage.from("rating-photos").remove(gone);
    if (paths.length) {
      const { error: photoError } = await supabase
        .from("rating_photos")
        .insert(paths.map((path, i) => ({ rating_id: saved.id, path, position: i + 1 })));
      if (photoError) return { error: "Saved your score, but the photos didn't attach. Try adding them again." };
    }
  }

  // Stay on the page and show what the rating changed (the panel also confirms it, so no redirect and no toast on arrival).
  const [after, { data: dish }] = await Promise.all([
    getStanding(supabase, dishId),
    supabase.from("dishes").select("name, restaurant:restaurants(slug, name)").eq("id", dishId).single<{ name: string; restaurant: { slug: string; name: string } }>(),
  ]);
  return {
    posted: {
      score: parsed.data.score,
      edited: Boolean(existing),
      dish: dish?.name ?? "this dish",
      place: dish?.restaurant.name ?? "",
      href: parsed.data.take ? `/review/${saved.id}` : dish ? dishHref(dish.restaurant.slug, dish.name) : "/",
      before,
      after,
      atHome: Boolean(after?.home && profile.regions?.name === after.home.region),
    },
  };
}

// Agree ("facts") / Disagree ("cap") / clear. The database blocks self-votes and keeps the counts.
export async function castVote(ratingId: string, kind: Vote | null) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  if (!kind) {
    await supabase.from("votes").delete().eq("rating_id", ratingId);
  } else {
    const { data } = await supabase.from("votes").update({ kind }).eq("rating_id", ratingId).select("rating_id");
    if (!data?.length) await supabase.from("votes").insert({ rating_id: ratingId, kind });
  }
  // Re-read the page so counts and your vote come from the database, not just the optimistic guess.
  refresh();
}

// Delete one of your own ratings: its photos rows, votes, comments and favourite pin go with it (cascade);
// then its photo files. Back to your profile afterwards.
export async function deleteRating(ratingId: string) {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  const { data: photos } = await supabase.from("rating_photos").select("path").eq("rating_id", ratingId);
  const { data: gone, error } = await supabase.from("ratings").delete().eq("id", ratingId).eq("user_id", userId).select("id");
  if (error || !gone?.length) throw new Error("Couldn't delete that take.");
  const paths = (photos ?? []).map((p) => p.path).filter((p) => p.startsWith(`${userId}/`));
  if (paths.length) await supabase.storage.from("rating-photos").remove(paths); // best effort: a leftover file is harmless

  redirect(`/u/${profile.username}?done=deleted`);
}

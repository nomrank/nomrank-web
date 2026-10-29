import type { SupabaseClient } from "@supabase/supabase-js";
import { dietsFor, type DishDiet, type ShowDiet } from "./diet";
import type { City } from "./cities";

export type Vote = "facts" | "cap";
export type Review = {
  id: string;
  score: number;
  take: string | null;
  facts_count: number;
  cap_count: number;
  comments_count: number;
  created_at: string;
  author: { username: string; avatar: string | null; avatar_path: string | null };
  dish: { id: string; name: string; diet: DishDiet; rating_count: number; avg_score: number | null; restaurant: { slug: string; name: string; area: string } };
  photos: { path: string; position: number }[];
};
export type Sort = "top" | "new";
export type FeedSort = Sort | "following";

// dishes!inner: a take only shows when its dish does (dishes waiting for approval are hidden from everyone but their creator).
const REVIEW_FIELDS =
  "id, score, take, facts_count, cap_count, comments_count, created_at, author:profiles!ratings_user_id_fkey(username, avatar, avatar_path), dish:dishes!inner(id, name, diet, rating_count, avg_score, restaurant:restaurants!inner(slug, name, area)), photos:rating_photos(path, position)";

export const FEED_PAGE = 20;

// Scores show one decimal (8.5, 9.0); a perfect 10 stays "10" so it fits the disc.
export function formatScore(score: number) {
  return score === 10 ? "10" : score.toFixed(1);
}

// How far a score sits from ketchup (0) to mustard (1). Most scores land between 5 and 10,
// so the blend runs over 4…9.5 to keep a 5 and a 6.5 visibly different.
export function scoreHeat(score: number) {
  return Math.min(1, Math.max(0, (score - 4) / 5.5));
}

// The score's colour: ketchup when low, mustard when high, blended in between.
export function scoreColor(score: number) {
  return `color-mix(in oklab, var(--ketchup), var(--mustard) ${Math.round(scoreHeat(score) * 100)}%)`;
}

// A short read of a score, shown beside the dish on a take: six tiers, from "Send it back" to "Must try".
export function verdict(score: number) {
  if (score >= 9) return { label: "Must try", tone: "must" } as const;
  if (score >= 8) return { label: "Order again", tone: "again" } as const;
  if (score >= 6.5) return { label: "Clean plate", tone: "clean" } as const;
  if (score >= 5) return { label: "Just okay", tone: "okay" } as const;
  if (score >= 3) return { label: "Skip it", tone: "skip" } as const;
  return { label: "Send it back", tone: "back" } as const;
}

// Public URL for a stored photo (the bucket is public-read).
export function photoUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rating-photos/${path}`;
}

function sorted<T extends { photos: { position: number }[] }>(rows: T[]) {
  for (const r of rows) r.photos.sort((a, b) => a.position - b.position);
  return rows;
}

// The feed: everyone's takes by Top (net votes) or New, or only takes from the people you follow (`authors`), newest
// first; one page at a time from `offset`, only dishes the diet preference allows, and only in `city` when one is picked.
// shortcut: offset paging can repeat or skip a take when votes reorder Top between pages (the client drops repeats);
// move to keyset paging if that shows up.
export async function getFeed(
  supabase: SupabaseClient,
  sort: FeedSort,
  authors: string[] = [],
  { offset = 0, limit = FEED_PAGE, show = "all", city = null }: { offset?: number; limit?: number; show?: ShowDiet; city?: City | null } = {},
) {
  if (sort === "following" && !authors.length) return [];
  let q = supabase.from("ratings").select(REVIEW_FIELDS).not("take", "is", null);
  if (sort === "following") q = q.in("user_id", authors);
  if (show !== "all") q = q.in("dish.diet", dietsFor(show));
  if (city) q = q.eq("dish.restaurant.city", city);
  q = sort === "top" ? q.order("net_votes", { ascending: false }).order("created_at", { ascending: false }) : q.order("created_at", { ascending: false });
  const { data, error } = await q.order("id").range(offset, offset + limit - 1).returns<Review[]>();
  if (error) throw error;
  return sorted(data);
}

// Every rating of one dish (scores for the average and spread; reviews for the list).
export async function getDishRatings(supabase: SupabaseClient, dishId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select(REVIEW_FIELDS)
    .eq("dish_id", dishId)
    .order("net_votes", { ascending: false })
    .returns<Review[]>();
  if (error) throw error;
  return sorted(data);
}

export async function getReview(supabase: SupabaseClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await supabase.from("ratings").select(REVIEW_FIELDS).eq("id", id).maybeSingle<Review>();
  if (error) throw error;
  return data && sorted([data])[0];
}

// The viewer's own votes on a set of reviews (votes are private, so this only ever returns theirs).
export async function getMyVotes(supabase: SupabaseClient, ratingIds: string[]) {
  if (!ratingIds.length) return {};
  const { data, error } = await supabase.from("votes").select("rating_id, kind").in("rating_id", ratingIds);
  if (error) throw error;
  return Object.fromEntries(data.map((v) => [v.rating_id, v.kind as Vote])) as Record<string, Vote>;
}

export function summarize(scores: number[]) {
  const count = scores.length;
  const average = count ? scores.reduce((a, b) => a + b, 0) / count : null;
  // Bars for 1…10; a half score counts with the whole number below it (8.5 → 8), and 0.5 sits in the first bar.
  const spread = Array.from({ length: 10 }, (_, i) => scores.filter((s) => Math.max(1, Math.floor(s)) === i + 1).length);
  return { count, average, spread };
}

// Takes posted by the same person at the same place within a few hours read as one meal in the feed.
// Each group sits where its first take appears; single takes stay as groups of one.
const MEAL_WINDOW_MS = 6 * 60 * 60 * 1000;

export function groupMeals(reviews: Review[]): Review[][] {
  const groups: Review[][] = [];
  for (const r of reviews) {
    const meal = groups.find(
      (g) =>
        g[0].author.username === r.author.username &&
        g[0].dish.restaurant.slug === r.dish.restaurant.slug &&
        g.some((x) => Math.abs(Date.parse(x.created_at) - Date.parse(r.created_at)) <= MEAL_WINDOW_MS),
    );
    if (meal) meal.push(r);
    else groups.push([r]);
  }
  return groups;
}

// Everything one person has rated, newest first: the profile's diary, and its takes (the ones with words).
// shortcut: loads the latest 200 in one go; page it once someone rates more than that.
export async function getUserRatings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select(REVIEW_FIELDS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<Review[]>();
  if (error) throw error;
  return sorted(data);
}

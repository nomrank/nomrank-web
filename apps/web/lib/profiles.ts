import type { SupabaseClient } from "@supabase/supabase-js";
import { UNLOCK_AT } from "./taste";
import type { DishDiet, ShowDiet } from "./diet";

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar: string | null;
  avatar_path: string | null;
  diet: Diet | null;
  instagram: string | null;
  created_at: string;
  regions: { name: string } | null;
  saves_visibility: Visibility;
  diary_visibility: Visibility;
  followers_visibility: Visibility;
  following_visibility: Visibility;
};

// Who can see a profile's "Want to try" list and Diary.
export type Visibility = "everyone" | "followers" | "only_me";
export const VISIBILITIES: { value: Visibility; label: string }[] = [
  { value: "everyone", label: "Everyone" },
  { value: "followers", label: "Followers" },
  { value: "only_me", label: "Only me" },
];

// The database enforces this for "Want to try"; the app mirrors it to say why a list is hidden, and to hide the Diary.
export function canSee(visibility: Visibility, { own, follows }: { own: boolean; follows: boolean }) {
  return own || visibility === "everyone" || (visibility === "followers" && follows);
}

export type Diet = "veg" | "eggetarian" | "vegan" | "non_veg";
export const DIETS: { value: Diet; label: string; mark: "veg" | "vegan" | "egg" | "non_veg" }[] = [
  { value: "veg", label: "Vegetarian", mark: "veg" },
  { value: "eggetarian", label: "Eggetarian", mark: "egg" },
  { value: "vegan", label: "Vegan", mark: "vegan" },
  { value: "non_veg", label: "Non-veg", mark: "non_veg" },
];

// trust: agrees minus disagrees on their takes, plus likes minus dislikes on their comments.
export type ProfileStats = { rated: number; average: number | null; trust: number; followers: number; following: number };

// A one-line read on someone's palate from their average score; says nothing until the taste read unlocks.
export function palate(average: number | null, rated: number) {
  if (average === null || rated < UNLOCK_AT) return null;
  if (average >= 8) return "Easy to please";
  if (average >= 6) return "Fair judge";
  return "Tough critic";
}

export type Favourite = {
  position: number;
  rating: {
    id: string;
    score: number;
    dish: { name: string; diet: DishDiet; rating_count: number; avg_score: number | null; restaurant: { slug: string; name: string } };
    photos: { path: string; position: number }[];
  };
};

export async function getProfileByHandle(supabase: SupabaseClient, handle: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar, avatar_path, diet, instagram, created_at, saves_visibility, diary_visibility, followers_visibility, following_visibility, regions(name)")
    .eq("username", handle)
    .maybeSingle<PublicProfile>();
  if (error) throw error;
  return data;
}

export async function getProfileStats(supabase: SupabaseClient, profileId: string): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc("profile_stats", { profile_id: profileId }).single<ProfileStats>();
  if (error) throw error;
  // Postgres numerics arrive as strings; the average is the only one.
  return { ...data, average: data.average === null ? null : Number(data.average) };
}

export async function getFavourites(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("favourites")
    .select("position, rating:ratings(id, score, dish:dishes(name, diet, rating_count, avg_score, restaurant:restaurants(slug, name)), photos:rating_photos(path, position))")
    .eq("user_id", profileId)
    .order("position")
    .returns<Favourite[]>();
  if (error) throw error;
  return data;
}

export type FollowKind = "followers" | "following";

// One person in someone's followers or following list; `following` is whether the viewer follows them.
export type FollowPerson = { id: string; username: string; display_name: string | null; avatar: string | null; avatar_path: string | null; following: boolean };

// shortcut: the newest 100 only. Page it when anyone has more.
const FOLLOW_LIST_MAX = 100;

// May the viewer open this list? The database decides (the owner's choice, and whether the viewer follows them).
export async function canSeeFollowList(supabase: SupabaseClient, ownerId: string, kind: FollowKind) {
  const { data, error } = await supabase.rpc("can_see_follow_list", { owner: ownerId, kind });
  if (error) throw error;
  return data === true;
}

// The people in `ownerId`'s followers (who follow them) or following (whom they follow), newest first. Check
// canSeeFollowList first: a follow can also be visible through the other person's list, so this alone doesn't gate it.
export async function getFollowList(supabase: SupabaseClient, ownerId: string, kind: FollowKind, viewerId: string | null): Promise<FollowPerson[]> {
  const other = kind === "followers" ? "follower_id" : "followee_id"; // the person on the far side of each follow
  const near = kind === "followers" ? "followee_id" : "follower_id";
  const { data, error } = await supabase
    .from("follows")
    .select(`person:profiles!follows_${other}_fkey(id, username, display_name, avatar, avatar_path)`)
    .eq(near, ownerId)
    .order("created_at", { ascending: false })
    .limit(FOLLOW_LIST_MAX)
    .returns<{ person: Omit<FollowPerson, "following"> }[]>();
  if (error) throw error;
  const people = data.map((r) => r.person);
  if (!viewerId || !people.length) return people.map((p) => ({ ...p, following: false }));
  const { data: mine, error: mineError } = await supabase.from("follows").select("followee_id").eq("follower_id", viewerId).in("followee_id", people.map((p) => p.id));
  if (mineError) throw mineError;
  const followed = new Set(mine.map((f) => f.followee_id as string));
  return people.map((p) => ({ ...p, following: followed.has(p.id) }));
}

// Who this person follows (ids), for the Following feed.
export async function getFollowees(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("follows").select("followee_id").eq("follower_id", userId);
  if (error) throw error;
  return data.map((f) => f.followee_id as string);
}

export async function isFollowing(supabase: SupabaseClient, followerId: string, followeeId: string) {
  const { count, error } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", followerId)
    .eq("followee_id", followeeId);
  if (error) throw error;
  return Boolean(count);
}

export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export const GENDERS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export type FeedDefault = "top" | "new" | "following";

// Your own birthday, gender and preferences. RLS returns a row only to its owner; no row yet = defaults.
export async function getPrivateDetails(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profile_private")
    .select("date_of_birth, gender, show_diet, feed_default")
    .eq("user_id", userId)
    .maybeSingle<{ date_of_birth: string | null; gender: Gender | null; show_diet: ShowDiet; feed_default: FeedDefault }>();
  if (error) throw error;
  return data;
}

// Dishes on someone's "Want to try" list, newest first.
export type SavedDish = { created_at: string; dish: { id: string; name: string; diet: DishDiet; rating_count: number; avg_score: number | null; restaurant: { slug: string; name: string; area: string } } };

export async function getSaves(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("saves")
    .select("created_at, dish:dishes(id, name, diet, rating_count, avg_score, restaurant:restaurants(slug, name, area))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<SavedDish[]>();
  if (error) throw error;
  return data;
}

export async function isSaved(supabase: SupabaseClient, userId: string, dishId: string) {
  const { count, error } = await supabase.from("saves").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("dish_id", dishId);
  if (error) throw error;
  return Boolean(count);
}

// How many people have a dish on their "Want to try" list.
export async function countWanted(supabase: SupabaseClient, dishId: string) {
  const { count, error } = await supabase.from("saves").select("*", { count: "exact", head: true }).eq("dish_id", dishId);
  if (error) throw error;
  return count ?? 0;
}

// "Want to try" state for the dishes in a list of posts: dish id → saved or not. Dishes the viewer has already rated
// are left out (nothing to try). Signed out, every dish shows the button, which leads to sign-in.
export async function getSaveStates(supabase: SupabaseClient, userId: string | null, dishIds: string[]) {
  const ids = [...new Set(dishIds)];
  if (!userId || !ids.length) return Object.fromEntries(ids.map((id) => [id, false])) as Record<string, boolean>;
  const [saves, rated] = await Promise.all([
    supabase.from("saves").select("dish_id").eq("user_id", userId).in("dish_id", ids),
    supabase.from("ratings").select("dish_id").eq("user_id", userId).in("dish_id", ids),
  ]);
  if (saves.error) throw saves.error;
  if (rated.error) throw rated.error;
  const done = new Set(rated.data.map((r) => r.dish_id));
  const saved = new Set(saves.data.map((s) => s.dish_id));
  return Object.fromEntries(ids.filter((id) => !done.has(id)).map((id) => [id, saved.has(id)])) as Record<string, boolean>;
}

// Just the preferences, with defaults when the row doesn't exist yet (signed out → everything, New).
export async function getPreferences(supabase: SupabaseClient, userId: string | null): Promise<{ show_diet: ShowDiet; feed_default: FeedDefault }> {
  const fallback = { show_diet: "all" as const, feed_default: "new" as const };
  if (!userId) return fallback;
  const details = await getPrivateDetails(supabase, userId);
  return details ? { show_diet: details.show_diet, feed_default: details.feed_default } : fallback;
}

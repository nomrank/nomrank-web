"use server";

import { getViewer } from "@/lib/auth";
import { getFollowees, getPreferences } from "@/lib/profiles";
import { getFeed, getMyVotes, type FeedSort } from "@/lib/ratings";

const SORTS: FeedSort[] = ["top", "new", "following"];

// The next page of the home feed, for infinite scroll. Same rules as the first page: the viewer's diet preference, and
// "following" only when signed in.
export async function loadMoreTakes(sort: FeedSort, offset: number) {
  if (!SORTS.includes(sort) || !Number.isInteger(offset) || offset < 0 || offset > 5000) return { reviews: [], votes: {} };
  const { supabase, userId, profile } = await getViewer();
  const prefs = await getPreferences(supabase, userId);
  const authors = sort === "following" && userId ? await getFollowees(supabase, userId) : [];
  const reviews = await getFeed(supabase, sort === "following" && !userId ? "new" : sort, authors, { offset, show: prefs.show_diet });
  const votes = profile ? await getMyVotes(supabase, reviews.map((r) => r.id)) : {};
  return { reviews, votes };
}

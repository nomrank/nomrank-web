import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { getCity, shouldAskCity } from "@/lib/city";
import { asHomeTab } from "@/lib/home-tab";
import { unreadCount } from "@/lib/notifications";
import { getRestaurants } from "@/lib/restaurants";
import { getFeed, getMostDiscussed, getMyVotes, type FeedSort } from "@/lib/ratings";
import { getFollowees, getPreferences } from "@/lib/profiles";
import { filterMenus } from "@/lib/diet";
import { getListedDishes, getLists, getRankings, listLeaders } from "@/lib/rankings";
import { PageShell } from "@/components/page-shell";
import { FeedSkeleton } from "@/components/loader";
import { HomeView } from "./home-view";

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense
      fallback={
        <PageShell wide>
          <FeedSkeleton />
        </PageShell>
      }
    >
      <Home searchParams={searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { sort: asked, account, tab } = await searchParams;
  const { supabase, userId, profile } = await getViewer();
  const [prefs, city] = await Promise.all([getPreferences(supabase, userId), getCity(profile)]);
  // No ?sort → your default feed. "Following" needs a signed-in viewer; signed out it falls back to New.
  const wanted = asked ?? prefs.feed_default;
  const sort: FeedSort = wanted === "top" ? "top" : wanted === "following" && userId ? "following" : "new";
  const authors = sort === "following" && userId ? await getFollowees(supabase, userId) : [];
  const [allRestaurants, feed, lists, listed, rankings, discussed] = await Promise.all([
    getRestaurants(supabase),
    getFeed(supabase, sort, authors, { show: prefs.show_diet }),
    getLists(supabase),
    getListedDishes(supabase),
    getRankings(supabase),
    getMostDiscussed(supabase, { show: prefs.show_diet, city }),
  ]);
  const restaurants = filterMenus(city ? allRestaurants.filter((r) => r.city === city) : allRestaurants, prefs.show_diet);
  const reviews = feed;
  const [votes, unread, askCity] = await Promise.all([
    profile ? getMyVotes(supabase, reviews.map((r) => r.id)) : {},
    profile && userId ? unreadCount(supabase, userId) : 0,
    account === "deleted" ? false : shouldAskCity(profile, city), // someone who just deleted their account isn't asked anything
  ]);
  return (
    <HomeView
      profile={profile}
      restaurants={restaurants}
      feed={{ sort, reviews, votes }}
      leaders={listLeaders(lists, city ? listed.filter((d) => d.restaurant.city === city) : listed, rankings, prefs.show_diet)}
      city={city}
      askCity={askCity}
      discussed={discussed}
      showTour={Boolean(profile && !profile.tour_done_at && !askCity)}
      unread={unread}
      initialView={asHomeTab(typeof tab === "string" ? tab : null)}
      showDiet={prefs.show_diet}
      notice={account === "deleted" ? "Your account and everything in it has been deleted." : undefined}
    />
  );
}

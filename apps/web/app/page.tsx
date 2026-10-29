import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { getCity } from "@/lib/city";
import { isAdmin } from "@/lib/admin";
import { unreadCount } from "@/lib/notifications";
import { getRestaurants } from "@/lib/restaurants";
import { getFeed, getMyVotes, type FeedSort } from "@/lib/ratings";
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
  const [prefs, city] = await Promise.all([getPreferences(supabase, userId), getCity()]);
  // No ?sort → your default feed. "Following" needs a signed-in viewer; signed out it falls back to Top.
  const wanted = asked ?? prefs.feed_default;
  const sort: FeedSort = wanted === "new" ? "new" : wanted === "following" && userId ? "following" : "top";
  const authors = sort === "following" && userId ? await getFollowees(supabase, userId) : [];
  const [allRestaurants, feed, lists, listed, rankings] = await Promise.all([
    getRestaurants(supabase),
    getFeed(supabase, sort, authors, { show: prefs.show_diet, city }),
    getLists(supabase),
    getListedDishes(supabase),
    getRankings(supabase),
  ]);
  const restaurants = filterMenus(city ? allRestaurants.filter((r) => r.city === city) : allRestaurants, prefs.show_diet);
  const reviews = feed;
  const [votes, admin, unread] = await Promise.all([
    profile ? getMyVotes(supabase, reviews.map((r) => r.id)) : {},
    profile ? isAdmin(supabase) : false,
    profile && userId ? unreadCount(supabase, userId) : 0,
  ]);
  return (
    <HomeView
      key={tab === "rankings" ? "rankings" : "takes"} // the nav's Rankings link lands on that tab even when already on "/"
      profile={profile}
      restaurants={restaurants}
      feed={{ sort, reviews, votes }}
      leaders={listLeaders(lists, city ? listed.filter((d) => d.restaurant.city === city) : listed, rankings, prefs.show_diet)}
      city={city}
      admin={admin}
      unread={unread}
      initialView={tab === "rankings" ? "rankings" : "takes"}
      showDiet={prefs.show_diet}
      notice={account === "deleted" ? "Your account and everything in it has been deleted." : undefined}
    />
  );
}

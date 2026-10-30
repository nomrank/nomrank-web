import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon, CrownIcon, HouseHeartIcon, PlusIcon, ScaleIcon, SproutIcon, TrophyIcon, UsersRoundIcon } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { getCity } from "@/lib/city";
import { CityPicker } from "@/components/city-picker";
import { shareList } from "@/lib/share";
import { allows } from "@/lib/diet";
import { dishHref } from "@/lib/dishes";
import { getPreferences } from "@/lib/profiles";
import { getList, getListedDishes, getLists, getRankedList, getRankings, listHref, listLeaders, type FoodList, type Leader, type RankedDish } from "@/lib/rankings";
import { cn } from "@/lib/utils";
import { BackLink } from "@/components/back-link";
import { DietMark } from "@/components/diet-mark";
import { DishAvg } from "@/components/dish-avg";
import { PageLoader } from "@/components/loader";
import { PageShell } from "@/components/page-shell";
import { dishCount } from "@/components/row";
import { TastesLikeHome } from "@/components/tastes-like-home";

export async function generateMetadata({ params }: PageProps<"/top/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const l = await shareList(slug);
  if (!l) return { title: "Ranking not found · Nomrank" };
  const title = `Top ${l.name} · Nomrank`;
  const description = l.top.length
    ? `The best ${l.name.toLowerCase()}, ranked by the people who ate it. #1: ${l.top[0].name} at ${l.top[0].place}.`
    : `Every ${l.name.toLowerCase()} on Nomrank, ranked by the people who ate it.`;
  return { title, description, openGraph: { title, description } };
}

export default function ListPage({ params }: PageProps<"/top/[slug]">) {
  return (
    <PageShell wide>
      <Suspense fallback={<PageLoader />}>
        <Ranking params={params} />
      </Suspense>
    </PageShell>
  );
}

async function Ranking({ params }: Pick<PageProps<"/top/[slug]">, "params">) {
  const { slug } = await params;
  const { supabase, userId, profile } = await getViewer();
  const list = await getList(supabase, decodeURIComponent(slug));
  if (!list) notFound();
  const city = await getCity();
  const [all, prefs, lists, listed, rankings] = await Promise.all([
    getRankedList(supabase, list.id, city),
    getPreferences(supabase, userId),
    getLists(supabase),
    getListedDishes(supabase),
    getRankings(supabase),
  ]);
  const dishes = all.filter((d) => allows(prefs.show_diet, d.diet));
  // Positions count within what's shown (the city and diet picked), so the list always reads 1, 2, 3.
  const ranked = dishes.filter((d) => d.rank !== null).map((d, i) => ({ ...d, rank: i + 1 }));
  const unrated = dishes.filter((d) => d.rank === null);
  const others = listLeaders(lists, city ? listed.filter((d) => d.restaurant.city === city) : listed, rankings, prefs.show_diet).filter((l) => l.list.id !== list.id);

  return (
    // Desktop: the ranking at reading width, with how it works and the other rankings pinned alongside.
    <div className="pb-10 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12 xl:gap-16">
      <div className="min-w-0">
        <BackLink href="/" />
        <header className="mt-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] text-mustard uppercase">
            <TrophyIcon aria-hidden className="size-3.5" />
            Rankings
          </p>
          <h1 className="mt-1.5 text-[1.75rem] leading-tight font-bold tracking-[-0.02em] wrap-anywhere">
            <span>
              Top {list.name}
              {city && <span className="text-muted-foreground"> in {city}</span>}
            </span>
          </h1>
          <CityPicker city={city} className="my-3" />
          <p className="mt-1 text-sm text-muted-foreground">
            {dishCount(dishes.length)}
            {ranked.length > 0 && ` · ${ranked.length} ranked`}
          </p>
          {prefs.show_diet !== "all" && (
            <p className="mt-2 text-sm text-faint">
              Showing the dishes your food preference allows.{" "}
              <Link href="/settings#preferences" className="font-semibold text-foreground underline-offset-4 hover:underline">
                Change
              </Link>
            </p>
          )}
        </header>

        {ranked.length > 0 ? (
          <ol className="stagger mt-5 divide-y divide-hairline">
            {ranked.map((d) => (
              <li key={d.id}>
                <RankRow dish={d} demonym={list.region?.demonym} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-6 rounded-xl border border-hairline bg-paper px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing rated here yet. Rate one and it takes the top spot.
          </p>
        )}

        {unrated.length > 0 && (
          <section aria-labelledby="unrated" className="mt-8">
            <h2 id="unrated" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
              Not rated yet
            </h2>
            <ul className="mt-1 divide-y divide-hairline">
              {unrated.map((d) => (
                <li key={d.id}>
                  <RankRow dish={d} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside aria-label="About this ranking" className="mt-10 flex flex-col gap-8 lg:sticky lg:top-6 lg:mt-14">
        <HowItWorks list={list} />
        <Link
          href={profile ? "/rate" : "/login"}
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md bg-ketchup px-4 font-semibold text-studio hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          <PlusIcon aria-hidden className="size-4" strokeWidth={2.5} />
          Rate what you ate
        </Link>
        {others.length > 0 && <MoreRankings leaders={others} />}
      </aside>
    </div>
  );
}

// One dish in the list: its rank (the top three in mustard, a crown on #1), name, place, everyone's score and Tastes like home.
function RankRow({ dish: d, demonym }: { dish: RankedDish; demonym?: string }) {
  const podium = d.rank !== null && d.rank <= 3;
  return (
    <Link
      href={dishHref(d.restaurant.slug, d.name)}
      className="-mx-2 flex min-h-16 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {d.rank !== null && (
        <span aria-label={`Rank ${d.rank}`} className="relative grid w-9 shrink-0 place-items-center">
          {d.rank === 1 && (
            <CrownIcon aria-hidden className="absolute -top-3 size-4 animate-[check-pop_480ms_var(--ease-out)_300ms_both] text-mustard" />
          )}
          <span className={cn("font-extrabold tracking-[-0.03em] tabular-nums", podium ? "text-2xl text-mustard" : "text-lg text-muted-foreground")}>
            {d.rank}
          </span>
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-semibold">
          <DietMark diet={d.diet} className="size-3 shrink-0" />
          <span className="wrap-anywhere">{d.name}</span>
        </span>
        <span className="mt-0.5 block text-sm text-faint wrap-anywhere">
          {d.restaurant.name}, {d.restaurant.area}
        </span>
        <TastesLikeHome avg={d.home_avg} count={d.home_count} demonym={demonym} className="mt-1 text-[0.8125rem]" />
      </span>
      <DishAvg avg={d.avg_score} count={d.rating_count} className="shrink-0 text-sm" />
    </Link>
  );
}

// What the order means, in four lines, and where to read more.
function HowItWorks({ list }: { list: FoodList }) {
  const points = [
    { icon: UsersRoundIcon, text: "Only ratings from people on Nomrank count. Nobody can pay for a spot." },
    { icon: ScaleIcon, text: "Weighted, so a single perfect 10 can't take the top on its own." },
    { icon: SproutIcon, text: "Ratings from accounts less than a week old count half." },
    ...(list.region ? [{ icon: HouseHeartIcon, text: `Tastes like home shows once 3 ${list.region.demonym} have rated a dish.` }] : []),
  ];
  return (
    <section aria-labelledby="how" className="rounded-2xl border border-hairline bg-paper p-4">
      <h2 id="how" className="text-sm font-semibold">
        How this ranking works
      </h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {points.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-mustard" />
            {text}
          </li>
        ))}
      </ul>
      <Link href="/about#rankings" className="mt-4 inline-flex min-h-9 items-center text-sm font-semibold underline-offset-4 hover:underline">
        More on how rankings work
      </Link>
    </section>
  );
}

// The other foods' rankings, each with its current #1.
function MoreRankings({ leaders }: { leaders: Leader[] }) {
  return (
    <section aria-labelledby="more">
      <h2 id="more" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
        More rankings
      </h2>
      <ul className="mt-2 divide-y divide-hairline">
        {leaders.map(({ list, count, leader }) => (
          <li key={list.id}>
            <Link
              href={listHref(list.name)}
              className="-mx-2 flex min-h-14 items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">Top {list.name}</span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-faint">
                  {leader ? (
                    <>
                      <CrownIcon aria-label="Number one:" className="size-3 shrink-0 text-mustard" />
                      <span className="truncate">{leader.name}</span>
                    </>
                  ) : (
                    `${dishCount(count)}, none rated yet`
                  )}
                </span>
              </span>
              <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

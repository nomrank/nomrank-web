import Link from "next/link";
import { ChevronRightIcon, ClockIcon, TrophyIcon } from "lucide-react";
import type { DishDetail, DishPageDish } from "@/lib/restaurants";
import { listHref, type Ranking } from "@/lib/rankings";
import { formatScore, photoUrl, scoreColor, summarize, type Review, type Sort, type Vote } from "@/lib/ratings";
import { dishHref } from "@/lib/dishes";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/page-shell";
import { ReviewCard } from "@/components/review-card";
import { BackLink } from "@/components/back-link";
import { DietMark } from "@/components/diet-mark";
import { ReportButton } from "@/components/report-button";
import { TastesLikeHome } from "@/components/tastes-like-home";

type Props = {
  dish: DishDetail & Partial<Pick<DishPageDish, "space" | "approved_at">>;
  ratings?: Review[];
  votes?: Record<string, Vote>;
  viewer?: string | null;
  sort?: Sort;
  rateNext?: React.ReactNode; // after you've rated this dish: the rest of the place's menu
  save?: React.ReactNode; // the "Want to try" button
  wanted?: number; // how many people have it on their "Want to try" list
  ranking?: Ranking | null; // its place in its food list, and Tastes like home
};

// Like a Letterboxd film page: title + poster, average and spread, your rating, then the takes.
export function DishView({ dish, ratings = [], votes = {}, viewer = null, sort = "top", rateNext, save, wanted = 0, ranking }: Props) {
  const { count, average, spread } = summarize(ratings.map((r) => r.score));
  const peak = Math.max(1, ...spread);
  const mine = viewer ? ratings.find((r) => r.author.username === viewer) : undefined;
  const poster = ratings.find((r) => r.photos[0])?.photos[0];
  const reviews = ratings
    .filter((r) => r.take)
    .sort((a, b) =>
      sort === "new" ? b.created_at.localeCompare(a.created_at) : b.facts_count - b.cap_count - (a.facts_count - a.cap_count),
    );
  const href = dishHref(dish.restaurant.slug, dish.name);

  return (
    <PageShell wide>
      {/* Desktop: the dish card stays pinned on the left while the takes scroll on the right. */}
      <div className="lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start lg:gap-14 xl:gap-20">
        <div className="flex flex-col lg:sticky lg:top-6">
          <BackLink href={`/r/${dish.restaurant.slug}`} />

          {dish.approved_at === null && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-mustard/40 bg-mustard/10 px-3 py-2 text-sm">
              <ClockIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-mustard" />
              Waiting for approval. This dish stays hidden from everyone else until it&apos;s reviewed.
            </p>
          )}
          <div className="mt-3 flex items-start gap-4 lg:flex-col-reverse">
            <div className="min-w-0 flex-1">
              <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] wrap-anywhere">
                  <DietMark diet={dish.diet} className="mr-2 size-4 align-[0.1em]" />
                  {dish.name}
                </h1>
              <p className="mt-1 text-muted-foreground">
                <Link href={`/r/${dish.restaurant.slug}`} className="underline-offset-4 hover:text-foreground hover:underline">
                  {dish.restaurant.name}
                </Link>
                , {dish.restaurant.area}
              </p>
            </div>
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage
              <img src={photoUrl(poster.path)} alt={`Photo of ${dish.name}`} className="aspect-[2/3] w-24 shrink-0 rounded-md object-cover lg:aspect-[4/3] lg:w-full" />
            )}
          </div>

          <section aria-label="Ratings" className="mt-6 flex items-end gap-6 border-y border-hairline py-4">
            <div className="shrink-0">
              <p className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">Overall rating</p>
              <p className="mt-1.5 flex items-center gap-2 text-3xl leading-none font-bold tabular-nums">
                {average !== null && <span aria-hidden className="size-2.5 rounded-full" style={{ background: scoreColor(average) }} />}
                {average === null ? "–" : average.toFixed(1)}
                {count > 0 && <span className="sr-only">{`, from ${count} ${count === 1 ? "rating" : "ratings"}`}</span>}
              </p>
              <p className="mt-1.5 text-xs text-faint">
                {[!count && "No ratings yet", wanted > 0 && `${wanted} want to try`].filter(Boolean).join(" · ") || " "}
              </p>
            </div>
            <div className="flex h-14 flex-1 items-end gap-[3px]" role="img" aria-label={`Scores: ${spread.map((n, i) => `${n} rated ${i + 1}`).join(", ")}`}>
              {spread.map((n, i) => (
                <span
                  key={i}
                  className="flex-1 origin-bottom animate-[bar-grow_320ms_var(--ease-out)_both] rounded-t-[2px] bg-faint/50"
                  style={{ height: `${Math.max(3, (n / peak) * 56)}px`, animationDelay: `${i * 25}ms` }}
                />
              ))}
            </div>
          </section>
          {dish.space && (
            <div className="mt-3 flex flex-col gap-1.5">
              <Link
                href={listHref(dish.space.name)}
                className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-md text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <TrophyIcon aria-hidden className="size-4 shrink-0 text-mustard" />
                {ranking?.rank ? `#${ranking.rank} in ${dish.space.name}` : `In the ${dish.space.name} ranking`}
                <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              {ranking && <TastesLikeHome avg={ranking.home_avg} count={ranking.home_count} demonym={dish.space.region?.demonym} />}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={viewer ? `/rate?dish=${dish.id}` : "/login"}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-ketchup px-4 font-semibold whitespace-nowrap text-studio hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              {!viewer ? "Sign in to rate" : mine ? `You rated it ${formatScore(mine.score)} · Change` : "Rate this dish"}
            </Link>
            {/* Saving for later only makes sense before you've had it. */}
            {!mine && save}
          </div>
          {rateNext && <div className="mt-4">{rateNext}</div>}
          <div className="mt-2 -ml-2">
            <ReportButton targetType="dish" targetId={dish.id} what="this dish" signedIn={viewer !== null} />
          </div>
        </div>

        <section aria-labelledby="takes" className="mt-8 pb-10 lg:mt-0 lg:pt-14">
          <div className="flex items-center justify-between gap-3 border-b border-hairline pb-2">
            <h2 id="takes" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
              Takes {reviews.length > 0 && <span className="tabular-nums">· {reviews.length}</span>}
            </h2>
            <nav aria-label="Sort takes" className="flex gap-4 text-sm">
              {(["top", "new"] as const).map((s) => (
                <Link
                  key={s}
                  href={s === "top" ? href : `${href}?sort=new`}
                  replace
                  scroll={false}
                  aria-current={sort === s ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 items-center capitalize focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    sort === s ? "font-semibold text-mustard" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s}
                </Link>
              ))}
            </nav>
          </div>
          {reviews.length ? (
            <ul className="stagger divide-y divide-hairline">
              {reviews.map((r) => (
                <li key={r.id}>
                  <ReviewCard review={r} vote={votes[r.id]} viewer={viewer} showDish={false} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">No takes on this dish yet.</p>
          )}
        </section>
      </div>
    </PageShell>
  );
}

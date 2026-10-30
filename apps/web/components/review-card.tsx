import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";
import { dishHref } from "@/lib/dishes";
import { type Review, type Vote } from "@/lib/ratings";
import { Score } from "@/components/score";
import { Verdict } from "@/components/verdict";

export { Score };
import { cn } from "@/lib/utils";
import { VoteButtons } from "@/components/vote-buttons";
import { PhotoCarousel } from "@/components/photo-carousel";
import { DietMark } from "@/components/diet-mark";
import { DishAvg } from "@/components/dish-avg";
import { SaveButton } from "@/components/save-button";
import { PersonLink } from "@/components/avatar";
import { timeAgo } from "@/lib/time";

type Props = {
  review: Review;
  vote?: Vote;
  viewer: string | null; // the viewer's username, or null when signed out
  showDish?: boolean; // feeds show the dish; a dish page doesn't need to repeat it
  full?: boolean; // the review page: no clamping, every photo large
  inMeal?: boolean; // one dish inside a meal card, whose header already names the place and the author
  saved?: boolean; // "Want to try" state of the dish for the viewer; left out when there's no button (they've rated it)
};

// One take in a list. Feeds lead with the dish (score + name + place) and sign the take underneath;
// on a dish page the dish is already the subject, so the author leads instead.
export function ReviewCard({ review: r, vote, viewer, showDish = true, full, inMeal, saved }: Props) {
  const mode = !viewer ? "signed-out" : viewer === r.author.username ? "own" : "vote";
  const byline = (
    <>
      <PersonLink handle={r.author.username} avatar={r.author.avatar} photo={r.author.avatar_path} className="text-muted-foreground hover:text-foreground" />
      <time dateTime={r.created_at} className="shrink-0 text-faint">
        {timeAgo(r.created_at)}
      </time>
    </>
  );
  return (
    <article className={cn("relative", inMeal ? "py-4" : "pt-5 pb-3 md:pb-5")}>
      {!showDish && (
        <header className="mb-3 flex items-center gap-2.5 text-sm">
          {byline}
          <span className="ml-auto flex items-center gap-2">
            <Verdict score={r.score} />
            <Score score={r.score} size={48} />
          </span>
        </header>
      )}

      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {showDish && (
            <header>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <DietMark diet={r.dish.diet} />
                  <Link
                    href={dishHref(r.dish.restaurant.slug, r.dish.name)}
                    className="relative z-10 text-[1.0625rem] leading-snug font-bold tracking-[-0.01em] wrap-anywhere hover:underline"
                  >
                    {r.dish.name}
                  </Link>
                  <Verdict score={r.score} />
                </div>
                {!inMeal && (
                  <p className="mt-0.5 text-sm text-faint wrap-anywhere">
                    from{" "}
                    <Link
                      href={`/r/${r.dish.restaurant.slug}`}
                      className="relative z-10 font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {r.dish.restaurant.name}
                    </Link>
                    {` · ${r.dish.restaurant.city}`}
                  </p>
                )}
                {/* Everyone's score for the dish shows on the opened post, not on feed cards. */}
                {full && <DishAvg avg={r.dish.avg_score} count={r.dish.rating_count} labeled className="mt-1.5 flex w-fit" />}
              </div>
            </header>
          )}
          <p className={cn("text-[0.9375rem] leading-relaxed text-foreground/90 wrap-anywhere", showDish && "mt-3", !full && "line-clamp-6")}>
            {full ? (
              r.take
            ) : (
              <Link href={`/review/${r.id}`} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring">
                {r.take}
              </Link>
            )}
          </p>
          {r.photos.length > 0 && (
            <PhotoCarousel
              photos={r.photos}
              dish={r.dish.name}
              href={full ? undefined : `/review/${r.id}`}
              className={cn("aspect-[4/3] w-full", full ? "mt-4 max-w-md" : "mt-3 max-w-72")}
            />
          )}
          {showDish && !inMeal && <p className="mt-2.5 flex items-center gap-2 text-[0.8125rem]">{byline}</p>}
        </div>
        {showDish && <Score score={r.score} size={full ? 76 : inMeal ? 54 : 66} />}
      </div>

      <div className="mt-3 flex items-start gap-3">
        <VoteButtons ratingId={r.id} facts={r.facts_count} cap={r.cap_count} mine={vote} mode={mode} />
        {!full && (
          <Link
            href={`/review/${r.id}#comments`}
            aria-label={`${r.comments_count} ${r.comments_count === 1 ? "comment" : "comments"}`}
            className="relative z-10 inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm text-muted-foreground tabular-nums hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <MessageCircleIcon aria-hidden className="size-[18px]" />
            {r.comments_count}
          </Link>
        )}
        {/* The opened post has room to say it; feed cards show just the bookmark. */}
        {saved !== undefined && (
          <span className="ml-auto">
            <SaveButton dishId={r.dish.id} saved={saved} signedIn={viewer !== null} compact={!full} className={cn(full && "min-h-9 rounded-full px-3.5 text-sm")} />
          </span>
        )}
      </div>
    </article>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, CheckIcon, HouseHeartIcon, PlusIcon, SparklesIcon, TrophyIcon } from "lucide-react";
import type { Posted } from "@/app/rating-actions";
import { formatScore } from "@/lib/ratings";
import { avgMove, rankMove, type Move } from "@/lib/rankings";
import { cn } from "@/lib/utils";
import { Score } from "@/components/score";
import { toast } from "@/components/toaster";

const MIN_HOME = 3; // Tastes like home shows from this many ratings by people from the dish's home

function Delta({ move }: { move: Move }) {
  const Icon = move.tone === "up" ? ArrowUpIcon : move.tone === "down" ? ArrowDownIcon : null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", move.tone === "up" ? "text-mustard" : move.tone === "down" ? "text-ketchup" : "text-muted-foreground")}>
      {Icon && <Icon aria-hidden className="size-3.5" strokeWidth={3} />}
      {move.text}
    </span>
  );
}

// After you post: what your score did to the dish. Each tile rises in a beat after the one before.
export function PostedPanel({ posted: p, rateAnother }: { posted: Posted; rateAnother: string }) {
  useEffect(() => toast(p.edited ? "Rating updated" : "Rating posted"), [p.edited]);

  const { before, after } = p;
  const rank = after && after.position !== null ? rankMove(before?.position ?? null, after.position) : null;
  const rating = avgMove(before?.avg ?? null, after?.avg ?? null);
  const home = after?.home ?? null;

  const tile = "flex flex-col gap-1.5 rounded-2xl border border-hairline bg-paper p-4 animate-[rise-in_420ms_var(--ease-out)_both] motion-reduce:animate-none";

  return (
    <div className="flex flex-col gap-5" role="status">
      <div className="flex items-center gap-4 animate-[rise-in_360ms_var(--ease-out)_both] motion-reduce:animate-none">
        <Score score={p.score} size={84} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-mustard">
            <CheckIcon aria-hidden className="size-4" strokeWidth={3} />
            {p.edited ? "Updated" : "Posted"}
          </p>
          <h1 className="text-2xl leading-tight font-bold tracking-tight wrap-anywhere">{p.dish}</h1>
          {p.place && <p className="text-muted-foreground wrap-anywhere">{p.place}</p>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {after && (
          <div className={tile} style={{ animationDelay: "120ms" }}>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <SparklesIcon aria-hidden className="size-4 text-mustard" />
              Overall rating
            </p>
            <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
              {before?.avg != null && before.avg !== after.avg && (
                <>
                  <span className="text-lg text-faint">{before.avg.toFixed(1)}</span>
                  <ArrowRightIcon aria-hidden className="size-4 self-center text-faint" />
                </>
              )}
              <span className="text-3xl font-bold">{after.avg === null ? "–" : formatScore(after.avg)}</span>
              <span className="text-sm text-muted-foreground">
                from {after.ratings} {after.ratings === 1 ? "rating" : "ratings"}
              </span>
            </p>
            {rating && <Delta move={rating} />}
          </div>
        )}

        {after && after.list && (
          <div className={tile} style={{ animationDelay: "220ms" }}>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrophyIcon aria-hidden className="size-4 text-mustard" />
              {after.list} in {after.city}
            </p>
            {after.position !== null ? (
              <>
                <p className="flex items-baseline gap-2 tabular-nums">
                  <span className="text-3xl font-bold">#{after.position}</span>
                  <span className="text-sm text-muted-foreground">of {after.ranked} ranked</span>
                </p>
                {rank && <Delta move={rank} />}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not ranked yet. It joins the list once it has a rating.</p>
            )}
          </div>
        )}

        {home && (
          <div className={cn(tile, "sm:col-span-2")} style={{ animationDelay: "320ms" }}>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <HouseHeartIcon aria-hidden className="size-4 text-mustard" />
              Tastes like home
            </p>
            {home.count >= MIN_HOME && home.avg !== null ? (
              <p className="tabular-nums">
                <span className="text-2xl font-bold">{formatScore(home.avg)}</span>
                <span className="text-muted-foreground">
                  {" "}
                  from {home.count} {home.demonym}
                </span>
              </p>
            ) : (
              <>
                <div className="flex gap-1.5" aria-hidden>
                  {Array.from({ length: MIN_HOME }, (_, i) => (
                    <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < home.count ? "bg-mustard" : "bg-raised")} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {p.atHome ? "Your rating counts here. " : ""}
                  {home.count} of {MIN_HOME} {home.demonym} so far. Its score shows once {MIN_HOME} have rated it.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1 animate-[rise-in_420ms_var(--ease-out)_420ms_both] motion-reduce:animate-none">
        <Link
          href={p.href}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ketchup px-5 font-semibold text-studio transition-[filter,transform] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.98]"
        >
          <TrophyIcon aria-hidden className="size-5" />
          See it
        </Link>
        <Link
          href={rateAnother}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-hairline bg-raised px-5 font-semibold transition-[background-color,transform] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98]"
        >
          <PlusIcon aria-hidden className="size-5" />
          Rate another dish
        </Link>
      </div>
    </div>
  );
}

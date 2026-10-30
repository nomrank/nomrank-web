"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Our ranking formula (the dish_rankings view): a dish starts with five imaginary 7s, so a few ratings can't carry it.
const PRIOR_COUNT = 5;
const PRIOR_SCORE = 7;

const DISHES = [
  { name: "Mutton biryani", place: "Ammi's Biryani House", avg: 9.1, n: 84 },
  { name: "Set dosa", place: "Sri Sagar", avg: 8.7, n: 212 },
  { name: "Ghee podi idli", place: "Tiffin Room", avg: 8.9, n: 31 },
  { name: "Chicken 65", place: "Paradise Corner", avg: 8.2, n: 140 },
  { name: "Mystery thali", place: "Opened last week", avg: 10, n: 1 },
];

type Mode = "raw" | "nomrank";
const scoreOf = (d: (typeof DISHES)[number], mode: Mode) => (mode === "raw" ? d.avg : (PRIOR_COUNT * PRIOR_SCORE + d.avg * d.n) / (PRIOR_COUNT + d.n));

const ROW = 64; // px: rows are laid out by index so a change of order slides them

// "One 10 can't win": the same five dishes sorted by plain average, then by our score. Tap to flip.
export function FairRankDemo() {
  const [mode, setMode] = useState<Mode>("raw");
  const order = [...DISHES].sort((a, b) => scoreOf(b, mode) - scoreOf(a, mode));

  return (
    <div data-ui className="w-full rounded-3xl bg-paper p-5 text-spotlight sm:p-7">
      <div role="radiogroup" aria-label="Sort by" className="grid grid-cols-2 gap-1 rounded-full bg-raised p-1">
        {(["raw", "nomrank"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "min-h-11 rounded-full px-3 text-[0.9375rem] font-semibold transition-[background-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-mustard focus-visible:outline-none active:scale-[0.98]",
              mode === m ? "bg-ketchup text-studio" : "text-muted-foreground",
            )}
          >
            {m === "raw" ? "Plain average" : "Nomrank score"}
          </button>
        ))}
      </div>

      {/* The rows slide by transform and keep their place in the page, so screen readers get the ranking here instead. */}
      <p className="sr-only" aria-live="polite">
        {order.map((d, i) => `${i + 1}, ${d.name}, ${scoreOf(d, mode).toFixed(1)}`).join(". ")}
      </p>
      <ol aria-hidden className="relative mt-4" style={{ height: ROW * DISHES.length }}>
        {DISHES.map((d) => {
          const i = order.indexOf(d);
          return (
            <li
              key={d.name}
              className="absolute inset-x-0 flex items-center gap-3 transition-transform duration-500 ease-[var(--ease-out)] motion-reduce:transition-none"
              style={{ height: ROW, transform: `translateY(${i * ROW}px)` }}
            >
              <span className="w-6 text-center text-[1.125rem] font-bold tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{d.name}</span>
                <span className="block truncate text-[0.875rem] text-muted-foreground">
                  {d.place} · {d.n} {d.n === 1 ? "rating" : "ratings"}
                </span>
              </span>
              <span className="text-[1.375rem] font-bold tabular-nums">{scoreOf(d, mode).toFixed(1)}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">
        {mode === "raw" ? "One person gives a new dish a 10 and it tops the list." : "Every dish starts with five 7s. A single 10 moves it a little. Hundreds of ratings move it a lot."}
      </p>
    </div>
  );
}

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PauseIcon, PlayIcon, PlusIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { verdict } from "@/lib/ratings";
import { Score } from "@/components/score";
import { TastesLikeHome } from "@/components/tastes-like-home";
import { VoteButtons } from "@/components/vote-buttons";
import { Verdict } from "@/components/verdict";

const STEP_MS = 3000;

// Each feature with a small working piece of the app that shows it, built from the app's own components.
const FEATURES = [
  { name: "Score any dish", text: "Score a plate from 1 to 10, then add a short take and photos.", Show: ScoreShow },
  { name: "Rankings for every food", text: "Top Biryani, Top Dosa and more. One lucky 10 can't buy the top spot.", Show: RankShow },
  { name: "Tastes like home", text: "How people from a dish's home region rate it, shown once three of them have.", Show: HomeShow },
  { name: "Agree or disagree", text: "Back a take or call it out. Every take shows how many people agree.", Show: VoteShow },
  { name: "Battles", text: "Two dishes, one pick. Vote and see which side is winning.", Show: BattleShow },
  { name: "Your city first", text: "Rankings follow your city. The feed shows takes from all of India.", Show: CityShow },
  { name: "Spaces for any food", text: "Every food gets its own leaderboard, and anyone can start one.", Show: SpacesShow },
  { name: "Follow people you trust", text: "Keep up with the people whose taste matches yours.", Show: FollowShow },
];

// The features as the product's own search list: type to filter, tap or arrow keys to select. While the section
// is on screen it moves to the next feature every 3 seconds; choosing one yourself or pressing Pause stops it, and
// Play resumes it. (No pausing on hover or focus: both stay put after a click, so Play would never take effect.)
// Reduced motion: it never starts. (No hover-to-select: an opening row would shift the rows under the pointer.)
export function FeatureList() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(FEATURES[0].name);
  const [auto, setAuto] = useState(true);
  const [inView, setInView] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const shown = FEATURES.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));
  const active = shown.find((f) => f.name === selected) ?? shown[0];
  const running = auto && inView && !query;

  function move(step: number) {
    if (!active) return;
    const i = shown.indexOf(active);
    setSelected(shown[(i + step + shown.length) % shown.length].name);
  }

  useEffect(() => {
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches; // the tour never runs for reduced motion
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting && !still), { threshold: 0.35 });
    if (root.current) io.observe(root.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setSelected((cur) => FEATURES[(FEATURES.findIndex((f) => f.name === cur) + 1) % FEATURES.length].name), STEP_MS);
    return () => clearTimeout(t);
  }, [running, selected]);

  const Show = active?.Show;
  return (
    <div
      ref={root}
      className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16"
    >
      <div className="min-w-0 lg:col-span-7">
        <div className="flex items-center gap-2">
          <div
            data-ui
            className="flex h-[1.9em] min-w-0 flex-1 items-center gap-[0.4em] rounded-lg bg-paper px-[0.5em] text-[1.25rem] focus-within:ring-2 focus-within:ring-mustard sm:text-[1.75rem]"
          >
            <SearchIcon aria-hidden className="size-[0.8em] shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setAuto(false);
                  move(e.key === "ArrowDown" ? 1 : -1);
                }
              }}
              placeholder="Find a feature"
              aria-label="Find a feature"
              aria-controls={listId}
              className="h-full min-w-0 flex-1 bg-transparent text-foreground caret-ketchup outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => setAuto((a) => !a)}
            aria-pressed={!auto}
            aria-label={auto ? "Pause the feature tour" : "Play the feature tour"}
            className="grid size-[2.375rem] shrink-0 place-items-center rounded-lg bg-paper text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-mustard sm:size-[3.325rem]"
          >
            {auto ? <PauseIcon aria-hidden className="size-5" /> : <PlayIcon aria-hidden className="size-5" />}
          </button>
        </div>

        <ul id={listId} className="mt-4 space-y-1">
          {shown.map((f, i) => {
            const on = f === active;
            return (
              <li
                key={f.name}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
                className={cn("relative overflow-hidden rounded-lg transition-colors duration-300", on && "bg-ketchup text-studio")}
              >
                <button
                  type="button"
                  aria-expanded={on}
                  onClick={() => {
                    setAuto(false);
                    setSelected(f.name);
                  }}
                  className={cn(
                    "w-full rounded-lg px-4 py-2 text-left text-[clamp(1.625rem,3.2vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.03em] transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-mustard",
                    !on && "text-foreground/50 hover:text-foreground",
                  )}
                >
                  {f.name}
                </button>
                {/* The open row's panel: every row keeps one, and it grows open or closed rather than snapping. */}
                <div
                  inert={!on}
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-out)]",
                    on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="px-4 pb-5">
                      <p className="min-h-[3lh] max-w-[44ch] text-[1.0625rem] leading-normal sm:min-h-[2lh] lg:min-h-0">{f.text}</p>
                      {/* On phones the explainer opens inside the row; on desktop it sits in the column beside the list. */}
                      {/* Always mounted, so a closing row shrinks smoothly; re-keyed on open so it slides in again. */}
                      <div className="mt-4 lg:hidden">
                        <Stage key={String(on)}>
                          <f.Show />
                        </Stage>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Time left before the tour moves on. */}
                {on && running && (
                  <span key={selected} aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left animate-[tour_3s_linear] bg-studio/25" />
                )}
              </li>
            );
          })}
          {!shown.length && <li className="px-4 text-[1.0625rem] text-muted-foreground">Nothing by that name yet.</li>}
        </ul>
      </div>

      <div className="hidden lg:sticky lg:top-10 lg:col-span-5 lg:block lg:self-start">
        <Stage>{Show && <Show key={active.name} />}</Stage>
      </div>
    </div>
  );
}

// The fixed frame each explainer sits in, so switching features never changes the page's height.
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[18rem] justify-center text-foreground lg:h-[25rem] lg:items-center lg:rounded-3xl lg:bg-paper lg:p-8">
      <div className="h-full w-full max-w-[24rem] animate-[explainer-in_380ms_var(--ease-out)_both] *:h-full lg:h-auto lg:*:h-auto">{children}</div>
    </div>
  );
}

const CARD = "rounded-2xl bg-background p-4 text-[0.875rem] sm:p-5";

// One score from each tier, best first.
const SCALE = [9.5, 8, 7, 5.5, 4, 2];

// What a score means: the six verdicts, each on its sticker.
function ScoreShow() {
  return (
    <div data-ui className={CARD}>
      <p className="text-[1.0625rem] font-semibold">What a score means</p>
      <ul className="stagger mt-4 grid grid-cols-3 gap-x-2 gap-y-4">
        {SCALE.map((n) => (
          <li key={n} className="flex flex-col items-center gap-2 text-center">
            <Score score={n} size={44} />
            <span className="text-[0.8125rem] leading-tight font-semibold text-muted-foreground">{verdict(n).label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TOP = [
  { name: "Chicken dum biryani", place: "Ammi's Biryani House", score: 9.1, ratings: 412 },
  { name: "Donne biryani", place: "Donne Point", score: 8.8, ratings: 268 },
  { name: "Mutton biryani", place: "Nizam's Table", score: 8.6, ratings: 197 },
];

function RankShow() {
  return (
    <div data-ui className={CARD}>
      <p className="text-[1.0625rem] font-semibold">Top Biryani</p>
      <ol className="stagger mt-3 space-y-2">
        {TOP.map((d, i) => (
          <li key={d.name} className="flex items-center gap-3 rounded-xl bg-raised/60 p-2.5">
            <span className="w-5 text-center text-[1rem] font-bold tabular-nums text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{d.name}</span>
              <span className="block truncate text-muted-foreground tabular-nums">
                {d.place} · {d.ratings} ratings
              </span>
            </span>
            <Score score={d.score} size={44} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function HomeShow() {
  return (
    <div data-ui className={CARD}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[1.0625rem] font-semibold">Hyderabadi biryani</p>
          <p className="text-muted-foreground">from Nizam&apos;s Table</p>
          <p className="text-muted-foreground tabular-nums">8.3 from everyone · 156 ratings</p>
        </div>
        <Score score={8.3} size={52} />
      </div>
      <div className="mt-4 animate-[rise-in_360ms_var(--ease-out)_160ms_both] rounded-xl bg-raised/60 p-3">
        <TastesLikeHome avg={8.7} count={12} demonym="Hyderabadis" />
      </div>
    </div>
  );
}

function VoteShow() {
  return (
    <div data-ui className={CARD}>
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-raised font-semibold">
          K
        </span>
        <p className="min-w-0 flex-1">
          <span className="block truncate font-semibold">@KaapiBefore9am</span>
          <span className="block text-muted-foreground">Filter coffee · Corner Kaapi Co.</span>
        </p>
        <Score score={9.5} size={44} />
      </div>
      <div className="mt-3">
        <Verdict score={9.5} />
      </div>
      <p className="mt-2 text-[0.9375rem] leading-relaxed">bitter in the best way. had two before 9am</p>
      <div className="mt-4">
        <VoteButtons ratingId="tour" facts={214} cap={12} mode="own" />
      </div>
    </div>
  );
}

function BattleShow() {
  return (
    <div data-ui className={CARD}>
      <p className="text-[1.0625rem] font-semibold">Dadar or Fort?</p>
      <div className="stagger mt-3 grid grid-cols-2 gap-2">
        {[
          { name: "Vada pav", at: "Dadar", share: 58, tone: "bg-ketchup" },
          { name: "Vada pav", at: "Fort", share: 42, tone: "bg-mustard" },
        ].map((s) => (
          <div key={s.at} className={cn("rounded-xl p-3 text-studio", s.tone)}>
            <p className="font-semibold">{s.name}</p>
            <p className="text-[0.875rem]">{s.at}</p>
            <p className="mt-2 text-[1.75rem] leading-none font-extrabold tabular-nums">{s.share}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CityShow() {
  return (
    <div data-ui className={CARD}>
      <p className="text-[1.0625rem] font-semibold">Where are you eating?</p>
      <div className="stagger mt-3 grid gap-2">
        {["Bengaluru", "Mumbai", "Delhi", "Hyderabad"].map((c) => (
          <span key={c} className={cn("flex min-h-10 items-center rounded-lg border px-3 font-semibold", c === "Mumbai" ? "border-mustard bg-raised" : "border-input")}>
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

const SPACES = ["Biryani", "Dosa", "Momos", "Filter coffee", "Vada pav", "Ghee roast", "Shawarma", "Idli"];

function SpacesShow() {
  return (
    <div data-ui className={CARD}>
      <p className="text-[1.0625rem] font-semibold">Spaces</p>
      <div className="stagger mt-3 flex flex-wrap gap-2">
        {SPACES.map((s) => (
          <span key={s} className="rounded-full bg-raised px-3 py-1.5 font-semibold">
            Top {s}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-input px-3 py-1.5 font-semibold text-muted-foreground">
          <PlusIcon aria-hidden className="size-4" />
          Start a Space
        </span>
      </div>
    </div>
  );
}

const PEOPLE = [
  { handle: "throwaway_dosa_99", match: 92, takes: 64 },
  { handle: "biryani_bandit", match: 87, takes: 41 },
];

function FollowShow() {
  return (
    <div data-ui className={CARD}>
      <p className="text-[1.0625rem] font-semibold">People with your taste</p>
      <ul className="stagger mt-3 space-y-2">
        {PEOPLE.map((p) => (
          <li key={p.handle} className="flex items-center gap-3 rounded-xl bg-raised/60 p-2.5">
            <span aria-hidden className="grid size-9 place-items-center rounded-full bg-raised font-semibold uppercase">
              {p.handle[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">@{p.handle}</span>
              <span className="block text-muted-foreground tabular-nums">
                {p.match}% taste match · {p.takes} takes
              </span>
            </span>
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-mustard px-4 text-sm font-semibold text-studio">
              <PlusIcon aria-hidden className="size-4" strokeWidth={2.5} />
              Follow
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

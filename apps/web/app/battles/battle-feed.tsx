"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, FlameIcon, ShareIcon, SwordsIcon, TrophyIcon } from "lucide-react";
import type { Battle, BattleSide } from "@/lib/battles";
import { split } from "@/lib/battles";
import { AGREE_CRUMBS, DISAGREE_CRUMBS, burst } from "@/lib/burst";
import type { City } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { DietMark } from "@/components/diet-mark";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/toaster";
import { voteBattle } from "./actions";

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A number that counts up to `to` once `run` turns true (the share of votes appearing after you pick).
function useCountUp(to: number, run: boolean) {
  const [shown, setShown] = useState(reduced() ? to : 0);
  useEffect(() => {
    if (!run) return;
    if (reduced()) {
      const t = setTimeout(() => setShown(to), 0);
      return () => clearTimeout(t);
    }
    let frame = 0;
    const start = performance.now() + 260; // let the panels settle first
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - start) / 900));
      setShown(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, run]);
  return run ? shown : 0;
}

export function BattleFeed({ battles: initial, signedIn, city, focus }: { battles: Battle[]; signedIn: boolean; city: City | null; focus: string | null }) {
  const router = useRouter();
  const [battles, setBattles] = useState(initial);
  const [streak, setStreak] = useState(0);
  const feed = useRef<HTMLDivElement>(null);
  const [played, setPlayed] = useState<ReadonlySet<string>>(new Set()); // battles that have filled the screen: each plays its entrance once
  const [saving, setSaving] = useState<ReadonlySet<string>>(new Set()); // votes the server has not confirmed yet
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A new city (or a fresh load) brings a new list.
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setBattles(initial);
  }

  // The battle on screen plays its entrance; one linked with ?b= opens right at it.
  useEffect(() => {
    const root = feed.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.battle;
          if (id && e.isIntersecting && e.intersectionRatio > 0.55) setPlayed((all) => (all.has(id) ? all : new Set(all).add(id)));
        }
      },
      { root, threshold: [0.56, 1] },
    );
    root.querySelectorAll("[data-battle]").forEach((el) => io.observe(el));
    if (focus) root.querySelector<HTMLElement>(`[data-battle="${CSS.escape(focus)}"]`)?.scrollIntoView({ block: "start" });
    return () => io.disconnect();
  }, [battles.length, focus]);

  const vote = useCallback(
    async (battle: Battle, side: "a" | "b", button: HTMLElement) => {
      if (!signedIn) return router.push("/login");
      if (battle.mine === side) return;
      const first = battle.mine === null;
      const before = battle;
      const optimistic = {
        ...battle,
        mine: side,
        votes: {
          a: battle.votes.a + (side === "a" ? 1 : 0) - (battle.mine === "a" ? 1 : 0),
          b: battle.votes.b + (side === "b" ? 1 : 0) - (battle.mine === "b" ? 1 : 0),
        },
      };
      setBattles((all) => all.map((b) => (b.id === battle.id ? optimistic : b)));
      if (first) setStreak((n) => n + 1);
      burst(button.closest("[data-fx]") as HTMLElement | null, button, side === "a" ? DISAGREE_CRUMBS : AGREE_CRUMBS);
      if (!reduced() && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(12);

      setSaving((all) => new Set(all).add(battle.id));
      const result = await voteBattle(battle.id, side);
      setSaving((all) => {
        const next = new Set(all);
        next.delete(battle.id);
        return next;
      });
      if ("error" in result) {
        toast(result.error);
        setBattles((all) => all.map((b) => (b.id === battle.id ? before : b)));
        if (first) setStreak((n) => Math.max(0, n - 1));
        return;
      }
      setBattles((all) => all.map((b) => (b.id === battle.id ? { ...b, votes: result.votes } : b)));

      // Two seconds to see the result, then on to the next fight, unless you have already scrolled away.
      if (advance.current) clearTimeout(advance.current);
      advance.current = setTimeout(() => {
        const root = feed.current;
        const cur = root?.querySelector<HTMLElement>(`[data-battle="${CSS.escape(battle.id)}"]`);
        if (!root || !cur) return;
        const onIt = Math.abs(cur.getBoundingClientRect().top - root.getBoundingClientRect().top) < 48;
        if (onIt) (cur.nextElementSibling as HTMLElement | null)?.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });
      }, 2000);
    },
    [router, signedIn],
  );

  useEffect(
    () => () => {
      if (advance.current) clearTimeout(advance.current);
    },
    [],
  );

  const share = async (b: Battle) => {
    const url = `${location.origin}/battles?b=${b.id}`;
    const text = `${b.a.name} at ${b.a.place} or ${b.b.name} at ${b.b.place}? Pick one on Nomrank.`;
    try {
      if (navigator.share) await navigator.share({ title: b.tag, text, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      }
    } catch {
      /* closed the share sheet */
    }
  };

  return (
    <div ref={feed} className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden">
      {battles.map((b, i) => (
        <BattleCard key={b.id} battle={b} index={i} total={battles.length} live={played.has(b.id)} saving={saving.has(b.id)} streak={streak} onVote={vote} onShare={share} />
      ))}
      <section data-battle="end" className="flex h-full snap-start flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-raised">
          <SwordsIcon aria-hidden className="size-7 text-mustard" />
        </span>
        <h2 className="text-2xl font-bold tracking-tight">{battles.length ? "That's every battle for now" : city ? `No battles in ${city} yet` : "No battles yet"}</h2>
        <p className="max-w-sm text-muted-foreground">New fights land regularly. In the meantime, the lists settle it the slow way.</p>
        <Link
          href="/?tab=rankings"
          className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-md bg-ketchup px-5 text-sm font-semibold text-studio transition-[filter,transform] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98]"
        >
          <TrophyIcon aria-hidden className="size-4" />
          See the top lists
        </Link>
      </section>
    </div>
  );
}

function BattleCard({
  battle: b,
  index,
  total,
  live,
  saving,
  streak,
  onVote,
  onShare,
}: {
  battle: Battle;
  index: number;
  total: number;
  live: boolean;
  saving: boolean;
  streak: number;
  onVote: (b: Battle, side: "a" | "b", button: HTMLElement) => void;
  onShare: (b: Battle) => void;
}) {
  const voted = b.mine !== null;
  const s = split(b.votes);
  const close = s.n >= 4 && Math.abs(b.votes.a - b.votes.b) <= 1;
  const list = b.a.list === b.b.list ? b.a.list : null;

  return (
    <section data-battle={b.id} data-live={live} aria-label={`Battle ${index + 1} of ${total}: ${b.tag}`} className="group/card relative isolate flex h-full snap-start flex-col justify-center overflow-hidden px-5 py-3">
      {/* Slow turning rays behind the fight, only for the battle on screen. */}
      <span aria-hidden className="battle-rays pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[170vmax] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-1000 group-data-[live=true]/card:opacity-100 motion-reduce:hidden" />
      <div className="relative mx-auto flex w-full max-w-[35rem] flex-col gap-[clamp(1rem,3.4dvh,1.75rem)]" data-fx>
        <header className="flex flex-col items-center gap-2 text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase transition-[opacity,transform] duration-500 ease-[var(--ease-out)] group-data-[live=false]/card:translate-y-2 group-data-[live=false]/card:opacity-0 motion-reduce:transition-none">
            <span className="tabular-nums">
              {index + 1} of {total}
            </span>
            {list && <span>· {list}</span>}
            <span>· {b.city ?? "City war"}</span>
            {close && <span className="text-mustard">· Neck and neck</span>}
          </p>
          <h2 className="max-w-[16ch] text-[clamp(1.875rem,8.6vw,2.75rem)] leading-[0.98] font-extrabold tracking-[-0.03em] text-balance transition-[opacity,transform] duration-500 ease-[var(--ease-out)] group-data-[live=false]/card:translate-y-3 group-data-[live=false]/card:opacity-0 motion-reduce:transition-none">
            {b.tag}
          </h2>
        </header>

        <div className="relative grid grid-cols-2 items-start gap-3.5">
          <Side battle={b} side="a" voted={voted} saving={saving} percent={s.a} lead={voted && s.n > 1 && b.votes.a > b.votes.b} onVote={onVote} />
          <Side battle={b} side="b" voted={voted} saving={saving} percent={s.b} lead={voted && s.n > 1 && b.votes.b > b.votes.a} onVote={onVote} />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-[min(calc((50vw-1.6rem)*4/3*0.5),19dvh)] left-1/2 z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-studio text-sm font-extrabold text-spotlight shadow-[0_0_0_2px_var(--spotlight)] transition-transform duration-500 ease-[cubic-bezier(0.3,1.6,0.5,1)] motion-reduce:transition-none",
              (!live || voted) && "scale-0",
            )}
          >
            VS
          </span>
        </div>

        <footer className="flex min-h-16 flex-col items-center justify-center gap-3">
          {voted ? (
            <>
              <div className="flex h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-raised" role="img" aria-label={`${s.a}% for ${b.a.name}, ${s.b}% for ${b.b.name}`}>
                <span className="h-full bg-ketchup transition-[width] duration-700 ease-[var(--ease-out)] motion-reduce:transition-none" style={{ width: `${s.a}%` }} />
                <span className="h-full flex-1 bg-mustard" />
              </div>
              <p aria-live="polite" className="text-center text-xs text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">{s.n}</span> {s.n === 1 ? "vote" : "votes"}
                {s.n <= 2 && " so far. You're early"}
                {streak >= 2 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-mustard">{streak} in a row</span>
                  </>
                )}
              </p>
            </>
          ) : (
            <p className="animate-[bask_2.4s_ease-in-out_infinite] text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase motion-reduce:animate-none">Tap the one you&apos;d order</p>
          )}
          <ShareButton onClick={() => onShare(b)} />
        </footer>
      </div>
    </section>
  );
}

function ShareButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-hairline px-4 text-sm font-semibold text-foreground transition-[border-color,background-color,transform] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95"
    >
      <ShareIcon aria-hidden className="size-4" />
      Share
    </button>
  );
}

// One corner: a cream polaroid (tilted, straightens when picked) holding the dish's score on a coloured tile, then its name, place and, after voting, its share.
function Side({
  battle,
  side,
  voted,
  saving,
  percent,
  lead,
  onVote,
}: {
  battle: Battle;
  side: "a" | "b";
  voted: boolean;
  saving: boolean;
  percent: number;
  lead: boolean;
  onVote: (b: Battle, side: "a" | "b", button: HTMLElement) => void;
}) {
  const d: BattleSide = battle[side];
  const mine = battle.mine === side;
  const shown = useCountUp(percent, voted);
  const a = side === "a";
  const rated = d.avg !== null && d.count > 0;

  return (
    <button
      type="button"
      aria-pressed={voted ? mine : undefined}
      aria-label={`Vote for ${d.name} at ${d.place}`}
      onClick={(e) => onVote(battle, side, e.currentTarget)}
      className={cn(
        "group/side relative flex min-w-0 flex-col items-center gap-1.5 text-center outline-none transition-opacity duration-300",
        "group-data-[live=false]/card:opacity-0 motion-reduce:animate-none",
        a ? "group-data-[live=true]/card:animate-[battle-in-l_650ms_var(--ease-out)_300ms_backwards]" : "group-data-[live=true]/card:animate-[battle-in-r_650ms_var(--ease-out)_620ms_backwards]",
        voted && !mine && "opacity-55",
      )}
    >
      <span
        className={cn(
          "relative block w-full rounded-[1.25rem] bg-spotlight p-1.5 shadow-[0_18px_40px_-16px_rgb(0_0_0/0.8)]",
          "transition-[transform,background-color] duration-500 ease-[var(--ease-out)] motion-reduce:transition-none",
          "group-focus-visible/side:ring-2 group-focus-visible/side:ring-ring group-focus-visible/side:ring-offset-2 group-focus-visible/side:ring-offset-background",
          "group-active/side:scale-[0.97] [@media(hover:hover)_and_(pointer:fine)]:group-hover/side:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:group-hover/side:rotate-0",
          a ? "-rotate-3" : "rotate-3",
          voted && mine && "scale-[1.03] rotate-0 bg-mustard",
          voted && !mine && "scale-95 rotate-0",
        )}
      >
        <span className={cn("relative grid aspect-[3/4] max-h-[36dvh] w-full place-content-center justify-items-center gap-1 overflow-hidden rounded-[0.9rem] text-studio", a ? "bg-ketchup" : "bg-mustard")}>
          <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgb(255_255_255/0.32),transparent_62%)]" />
          <span className="absolute top-2 left-2 rounded bg-spotlight p-1">
            <DietMark diet={d.diet} className="size-3" />
          </span>
          <span className="relative text-[clamp(2.75rem,15vw,4.25rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums">{rated ? d.avg!.toFixed(1) : "New"}</span>
          <span className="relative text-[0.6875rem] font-semibold tracking-[0.06em] uppercase opacity-70">{rated ? `${d.count} ${d.count === 1 ? "rating" : "ratings"}` : "No ratings yet"}</span>
        </span>
        {lead && (
          <span className="absolute -top-2.5 right-2 inline-flex animate-[rise-in_320ms_var(--ease-out)_both] items-center gap-1 rounded-full bg-studio px-2 py-1 text-[0.6875rem] font-bold tracking-[0.04em] text-mustard uppercase">
            <FlameIcon aria-hidden className="size-3 fill-current" />
            Leading
          </span>
        )}
      </span>

      <span className="mt-1 flex min-h-6 items-center">
        {voted && mine && (
          <span className="inline-flex animate-[check-pop_420ms_var(--ease-out)_both] items-center gap-1 rounded-full bg-studio px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.04em] text-mustard uppercase">
            {saving ? <Spinner className="size-3" /> : <CheckIcon aria-hidden className="size-3" strokeWidth={3} />}
            Your pick
          </span>
        )}
      </span>

      <span className="text-[clamp(1.0625rem,4.8vw,1.375rem)] leading-[1.05] font-bold text-balance wrap-anywhere">{d.name}</span>
      <span className="text-[0.6875rem] leading-snug font-medium tracking-[0.06em] text-muted-foreground uppercase wrap-anywhere">
        {d.place}
        {battle.city === null && ` · ${d.city}`}
      </span>
      {voted && <span className={cn("text-[2.125rem] leading-none font-extrabold tabular-nums", mine ? "text-mustard" : "text-muted-foreground")}>{shown}%</span>}
    </button>
  );
}

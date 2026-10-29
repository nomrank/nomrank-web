"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { angleOf, point, scoreAtAngle, sector } from "@/lib/plate";
import { formatScore, scoreColor, verdict } from "@/lib/ratings";
import { cn } from "@/lib/utils";

const OUTER = 137; // the ring is drawn 3 units inside its edge; a 6-unit round-joined stroke gives the soft corners
const INNER = 91;
const SLICES = Array.from({ length: 10 }, (_, i) => i + 1);

// The score as a plate: 10 slices of one point each that fill ketchup-to-mustard as you go round; a half point fills half a slice.
// Tap a slice or drag round the ring; −/+ step by half a point. The hidden range input keeps keyboard and screen-reader use.
export function ScoreMeter({ score, onChange }: { score: number; onChange: (n: number) => void }) {
  const [from, setFrom] = useState(score);
  const [dragging, setDragging] = useState(false);
  const color = score ? scoreColor(score) : undefined;

  const pick = (n: number) => {
    if (n === score) return;
    setFrom(score);
    onChange(n);
    // A tick on Android as the score changes (no-op where unsupported or when the person prefers less motion).
    if (navigator.userActivation?.hasBeenActive && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(6);
  };
  const step = (by: number) => pick(Math.min(10, Math.max(0.5, score + by)));

  const read = (e: React.PointerEvent<SVGSVGElement>, prev: number) => {
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = e.clientY - (box.top + box.height / 2);
    return { v: scoreAtAngle(angleOf(dx, dy), prev), dist: Math.hypot(dx, dy) / (box.width / 300) };
  };

  return (
    <div className="mx-auto w-full max-w-72">
      <label htmlFor="score" className="sr-only">
        Your score
      </label>
      <div className="relative rounded-full has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-4 has-[:focus-visible]:ring-offset-background">
        <svg
          viewBox="0 0 300 300"
          aria-hidden
          className="block w-full touch-none select-none"
          onPointerDown={(e) => {
            const { v, dist } = read(e, 0);
            if (dist > OUTER + 8 || dist < INNER - 12) return; // only the ring starts a gesture, not the middle
            e.currentTarget.setPointerCapture(e.pointerId);
            setDragging(true);
            pick(v);
          }}
          onPointerMove={(e) => dragging && pick(read(e, score).v)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          {SLICES.map((i) => {
            // A slice is one point. Its fill is 0, half (the first half, for .5) or whole.
            const fill = (s: number) => Math.min(1, Math.max(0, s - (i - 1)));
            const a0 = (i - 1) * 36 + 2.5;
            const a1 = i * 36 - 2.5;
            const mid = (i - 0.5) * 36;
            const changed = fill(from) !== fill(score);
            // Picking ripples outward from the previous score, 30ms per slice; while dragging it tracks the finger with no delay.
            const delay = !dragging && changed ? Math.abs(i - Math.ceil(from)) * 30 : 0;
            const layer = (d: string, on: boolean) => (
              <path
                d={d}
                strokeWidth={6}
                strokeLinejoin="round"
                className="transition-[fill,stroke,opacity] duration-200 ease-[var(--ease-out)] motion-reduce:transition-none"
                style={{ fill: color, stroke: color, opacity: on ? 1 : 0, transitionDelay: `${delay}ms` }}
              />
            );
            const [dx, dy] = [point(5, mid)[0] - 150, point(5, mid)[1] - 150]; // 5 units out along the slice's middle, rounded like the paths
            return (
              <g
                key={i}
                className="transition-transform duration-200 ease-[var(--ease-out)] motion-reduce:transition-none"
                // The slice the score has reached lifts out of the ring a touch.
                style={{ transform: score > i - 1 && score <= i ? `translate(${dx}px, ${dy}px)` : undefined }}
              >
                <path d={sector(a0, a1, OUTER, INNER)} strokeWidth={6} strokeLinejoin="round" className="fill-raised stroke-raised" />
                {layer(sector(a0, mid, OUTER, INNER), fill(score) >= 0.5)}
                {layer(sector(a0, a1, OUTER, INNER), fill(score) === 1)}
              </g>
            );
          })}
          {Array.from({ length: 10 }, (_, i) => {
            const [x, y] = point((OUTER + INNER) / 2, i * 36 + 18);
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn("pointer-events-none text-[15px] font-semibold tabular-nums transition-colors duration-200", score >= i + 1 ? "fill-studio" : "fill-faint")}
              >
                {i + 1}
              </text>
            );
          })}
        </svg>

        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="inline-flex h-[4.25rem] overflow-hidden text-[3.75rem] leading-[4.25rem] font-bold tabular-nums">
            <span key={score} className={cn(score ? "animate-[roll-up_160ms_var(--ease-out)] motion-reduce:animate-none" : "text-faint")} style={{ color }}>
              {score ? formatScore(score) : "–"}
            </span>
          </span>
          <span key={verdict(score || 1).label} className="mt-1 h-5 text-sm font-semibold text-muted-foreground animate-[rise-in_180ms_var(--ease-out)] motion-reduce:animate-none">
            {score ? verdict(score).label : "Pick a score"}
          </span>
        </div>

        <input
          id="score"
          type="range"
          name={score ? "score" : undefined}
          min={0.5}
          max={10}
          step={0.5}
          value={score || 0.5}
          aria-valuetext={score ? `${formatScore(score)} out of 10, ${verdict(score).label}` : "Not scored yet"}
          onChange={(e) => pick(Number(e.target.value))}
          tabIndex={0}
          className="pointer-events-none absolute inset-0 size-full appearance-none opacity-0"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <StepButton label="Lower the score by half a point" onClick={() => step(-0.5)} disabled={score <= 0.5}>
          <MinusIcon aria-hidden className="size-5" />
        </StepButton>
        <p aria-hidden className="text-center text-sm text-muted-foreground">
          Tap or drag round the plate
        </p>
        <StepButton label="Raise the score by half a point" onClick={() => step(0.5)} disabled={score >= 10}>
          <PlusIcon aria-hidden className="size-5" />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-hairline bg-raised text-foreground transition-[transform,opacity] duration-150 ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-90 disabled:opacity-40 disabled:active:scale-100"
    >
      {children}
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand";

// The fox arrives, then idles: it floats a little, its hand gives the OK now and then and the sparkle glints, over a soft
// glow. Under reduced motion it just stands there.
export function BroadcastLoader({ size = 56, label = "Loading", className }: { size?: number; label?: string; className?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("relative grid place-items-center text-foreground", className)} style={{ width: size, height: size }}>
      <span aria-hidden className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgb(255_194_60/0.16),transparent)]" />
      <LogoMark size={size} animate className="relative" />
    </span>
  );
}

// What the kitchen's doing while the page loads.
const LINES = ["Heating the tawa", "Steaming the idlis", "Grinding the chutney", "Pouring the filter kaapi", "Plating up"];

// A whole-page wait: the mark centred, with a kitchen line under it that changes every couple of seconds.
export function PageLoader() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((n) => (n + 1) % LINES.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-1 animate-[fade-in_300ms_var(--ease-out)_120ms_both] flex-col items-center justify-center gap-5 py-24">
      <BroadcastLoader size={76} />
      <p aria-hidden key={line} className="animate-[line-in_260ms_var(--ease-out)] text-sm font-medium text-muted-foreground">
        {LINES[line]}…
      </p>
    </div>
  );
}

// The feed's shape while it loads: three take cards in grey, shimmering.
export function FeedSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading takes" className="flex flex-col">
      <div className="skeleton h-11 rounded-md" />
      <div className="mt-6 flex gap-6">
        {[56, 52, 52].map((w, i) => (
          <div key={i} className="skeleton h-4 rounded" style={{ width: w }} />
        ))}
      </div>
      <ul className="mt-8 divide-y divide-hairline">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex gap-4 py-5">
            <div className="min-w-0 flex-1">
              <div className="skeleton h-5 w-2/5 rounded" />
              <div className="skeleton mt-2 h-3.5 w-1/4 rounded" />
              <div className="skeleton mt-4 h-3.5 w-full rounded" />
              <div className="skeleton mt-2 h-3.5 w-4/5 rounded" />
              <div className="skeleton mt-4 h-9 w-44 rounded-full" />
            </div>
            <div className="skeleton size-12 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

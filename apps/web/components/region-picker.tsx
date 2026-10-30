"use client";

import { useId, useState } from "react";
import { CheckIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type PickableRegion = { slug: string; name: string; kind: "state" | "ut" };

const GROUPS = [
  { kind: "state", label: "States" },
  { kind: "ut", label: "Union territories" },
] as const;

// Where you grew up eating: every state and union territory, searchable and grouped. A radio group, so it submits
// with the form (`name`) and works with the keyboard.
export function RegionPicker({
  regions,
  value,
  onChange,
  name,
  className,
}: {
  regions: PickableRegion[];
  value: string;
  onChange: (slug: string) => void;
  name: string;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const listId = useId();
  const needle = q.trim().toLowerCase();
  const shown = regions.filter((r) => !needle || r.name.toLowerCase().includes(needle));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your state"
          aria-label="Search states and union territories"
          aria-controls={listId}
          autoComplete="off"
          className="h-11 w-full rounded-md border border-input bg-raised pr-3 pl-10 text-base focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        />
      </div>
      <div id={listId} className="-mx-1 max-h-[22rem] overflow-y-auto overscroll-contain px-1 py-0.5 [scrollbar-width:thin]">
        {GROUPS.map(({ kind, label }) => {
          const items = shown.filter((r) => r.kind === kind);
          if (!items.length) return null;
          return (
            <section key={kind} aria-label={label} className="pb-3 last:pb-0">
              <h3 className="sticky top-0 z-10 bg-background/95 py-1.5 text-xs font-semibold tracking-[0.08em] text-faint uppercase backdrop-blur-sm">{label}</h3>
              <div className="mt-1 grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-2">
                {items.map((r) => (
                  <label
                    key={r.slug}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[0.9375rem] leading-tight font-semibold transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-out)] has-focus-visible:ring-2 has-focus-visible:ring-ring active:scale-[0.98]",
                      value === r.slug ? "border-mustard bg-raised" : "border-input hover:bg-raised",
                    )}
                  >
                    <input type="radio" name={name} value={r.slug} checked={value === r.slug} onChange={() => onChange(r.slug)} className="sr-only" />
                    <span className="min-w-0 text-pretty">{r.name}</span>
                    <CheckIcon aria-hidden className={cn("size-4 shrink-0 text-primary", value === r.slug ? "animate-[check-pop_420ms_var(--ease-out)_both]" : "opacity-0")} />
                  </label>
                ))}
              </div>
            </section>
          );
        })}
        {!shown.length && <p className="py-6 text-center text-sm text-muted-foreground">No state or territory matches &ldquo;{q}&rdquo;.</p>}
      </div>
    </div>
  );
}

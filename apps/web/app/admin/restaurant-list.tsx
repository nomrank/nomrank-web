"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, SearchIcon, XIcon } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type Row = { id: string; slug: string; name: string; area: string; city: string; dishes: number };

// Every restaurant as a card, with a search that filters as you type (name, area or city) and city chips. Choosing one opens
// its page, where the menu is managed.
export function RestaurantList({ restaurants }: { restaurants: Row[] }) {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const shown = restaurants.filter((r) => (!city || r.city === city) && (!q || `${r.name} ${r.area} ${r.city}`.toLowerCase().includes(q)));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-md sm:flex-1">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, area or city"
            aria-label="Search restaurants"
            className="h-11 bg-raised pr-10 pl-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <XIcon aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Filter by city" className="flex flex-wrap gap-1.5">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={city === c}
              onClick={() => setCity(city === c ? null : c)}
              className={cn(
                "min-h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                city === c ? "border-mustard bg-mustard/15 text-foreground" : "border-hairline text-muted-foreground hover:border-input hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
        {shown.length === restaurants.length ? `${restaurants.length} restaurants` : `${shown.length} of ${restaurants.length} restaurants`}
      </p>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nothing matches. Try a shorter search.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r) => (
            <li key={r.id}>
              <Link
                href={`/?tab=restaurants&place=${r.slug}`}
                className="group flex min-h-16 items-center gap-3 rounded-2xl border border-hairline bg-paper p-3 transition-[border-color,transform] duration-150 hover:border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.99]"
              >
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-raised text-lg font-extrabold">
                  {r.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className="block truncate text-xs text-faint">
                    {r.area}, {r.city}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-raised px-2.5 py-1 text-xs font-semibold text-muted-foreground tabular-nums">{r.dishes}</span>
                <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-faint transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

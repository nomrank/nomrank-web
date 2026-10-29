"use client";

import { useDeferredValue, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import { dishKey } from "@/lib/dishes";
import { Input } from "@/components/ui/input";
import { Row } from "@/components/row";
import { DishAvg } from "@/components/dish-avg";
import { DishGroupRow, groupDishes } from "@/components/dish-group";

// Step one of rating: find the dish. A dish served at several places shows once, and opens to pick the place.
export function DishPicker({ restaurants }: { restaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const q = dishKey(useDeferredValue(query));
  const groups = groupDishes(
    q ? restaurants.map((r) => ({ ...r, dishes: r.dishes.filter((d) => dishKey(`${d.name} ${r.name}`).includes(q)) })) : restaurants,
  ).sort((a, b) => a.name.localeCompare(b.name));
  const popular = restaurants
    .flatMap((r) => r.dishes.map((d) => ({ ...d, place: r })))
    .filter((d) => d.rating_count > 0)
    .sort((a, b) => b.rating_count - a.rating_count)
    .slice(0, 6);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-14 xl:gap-20">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dish or place"
            aria-label="Find the dish you ate"
            autoComplete="off"
            autoFocus
            className="h-11 bg-raised pl-11 text-base"
          />
        </div>
        <ul className="divide-y divide-border" aria-live="polite">
          {groups.map((g) => (
            <li key={g.key}>
              <DishGroupRow group={g} href={(s) => `/rate?dish=${s.id}`} open={q !== "" && g.spots.length > 1} />
            </li>
          ))}
        </ul>
        {!groups.length && <p className="text-muted-foreground">Not here yet? Open the place and add the dish first.</p>}
      </div>

      {/* Desktop: the most-rated dishes, one tap from rating, so the page isn't a lone narrow column. */}
      {popular.length > 0 && !q && (
        <aside aria-label="Most rated dishes" className="mt-8 rounded-2xl border border-hairline bg-paper p-5 lg:sticky lg:top-6 lg:mt-0 lg:self-start">
          <h2 className="text-base font-bold">Most rated right now</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Had one of these? Tap to rate it.</p>
          <ul className="mt-2 divide-y divide-border">
            {popular.map((d) => (
              <li key={d.id}>
                <Row href={`/rate?dish=${d.id}`} diet={d.diet} title={d.name} meta={<>{d.place.name} · <DishAvg avg={d.avg_score} count={d.rating_count} orEmpty /></>} />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

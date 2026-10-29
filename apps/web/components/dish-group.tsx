import { ChevronDownIcon } from "lucide-react";
import type { Restaurant } from "@/lib/restaurants";
import type { DishDiet } from "@/lib/diet";
import { dishKey } from "@/lib/dishes";
import { DishAvg } from "@/components/dish-avg";
import { Row } from "@/components/row";

type Spot = { id: string; name: string; diet: DishDiet; avg: number | null; count: number; place: Restaurant };
export type DishGroup = { key: string; name: string; spots: Spot[] };

// The same dish at several places shows once; most-served dishes first.
export function groupDishes(restaurants: Restaurant[], q = "") {
  const groups = new Map<string, DishGroup>();
  for (const place of restaurants) {
    for (const d of place.dishes) {
      const key = dishKey(d.name);
      if (q && !key.includes(q)) continue;
      const g = groups.get(key) ?? { key, name: d.name, spots: [] };
      g.spots.push({ id: d.id, name: d.name, diet: d.diet, avg: d.avg_score, count: d.rating_count, place });
      groups.set(key, g);
    }
  }
  return [...groups.values()].sort((a, b) => b.spots.length - a.spots.length || a.name.localeCompare(b.name));
}

// One dish. At one place it's a plain row; at several it's a dropdown of those places. `href` says where a place goes
// (the dish page when browsing, the rating form when rating); `open` starts the dropdown unfolded (a search narrowed to it).
export function DishGroupRow({ group: g, href, open }: { group: DishGroup; href: (spot: Spot) => string; open?: boolean }) {
  const title = <span className="block text-base font-semibold wrap-anywhere">{g.name}</span>;

  if (g.spots.length === 1) {
    const spot = g.spots[0];
    return <Row href={href(spot)} title={title} meta={<>{spot.place.name} · <DishAvg avg={spot.avg} count={spot.count} orEmpty /></>} diet={spot.diet} />;
  }
  return (
    <details className="group" open={open}>
      <summary className="-mx-2 flex min-h-16 cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          {title}
          <span className="mt-0.5 block text-sm text-muted-foreground">At {g.spots.length} places</span>
        </span>
        <ChevronDownIcon aria-hidden className="size-5 shrink-0 text-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <ul className="mb-2 ml-3 animate-[rise_320ms_var(--ease-out-expo)_both] divide-y divide-border border-l-2 border-mustard pl-3">
        {g.spots.map((spot) => (
          <li key={spot.id}>
            <Row href={href(spot)} title={spot.place.name} meta={<>{spot.place.area} · <DishAvg avg={spot.avg} count={spot.count} orEmpty /></>} diet={spot.diet} />
          </li>
        ))}
      </ul>
    </details>
  );
}

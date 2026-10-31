"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";
import type { DishDiet } from "@/lib/diet";
import { Input } from "@/components/ui/input";
import { AddDishForm, DishEditor } from "./forms";
import { ActionButton } from "./controls";
import { removeContent } from "./actions";

type Dish = { id: string; name: string; diet: DishDiet; rating_count: number; approved_at: string | null };

// A restaurant's menu: add a dish at the top, find one with the search, and edit or remove any row. Dishes you add go live
// straight away, so a row says "Waiting for review" only for ones people suggested.
export function MenuManager({ restaurantId, dishes }: { restaurantId: string; dishes: Dish[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? dishes.filter((d) => d.name.toLowerCase().includes(q)) : dishes;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-dashed border-input bg-raised/40 p-3 sm:p-4">
        <p className="mb-3 text-sm font-semibold">Add a dish</p>
        <AddDishForm restaurantId={restaurantId} />
      </div>

      {dishes.length > 6 && (
        <div className="relative max-w-sm">
          <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this menu" aria-label="Search this menu" className="h-11 bg-raised pl-10" />
        </div>
      )}

      {dishes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No dishes yet. Add the first one above.</p>
      ) : shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No dish matches that.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((d) => (
            <li key={d.id} className="rounded-xl border border-hairline bg-background/40 p-3">
              <DishEditor dish={d}>
                <span className="text-xs text-faint tabular-nums">{d.approved_at ? `${d.rating_count} ${d.rating_count === 1 ? "rating" : "ratings"}` : "Waiting for review"}</span>
                <ActionButton run={removeContent} args={["dish", d.id, "Removed by an admin"]} label="Remove" icon="remove" done="Dish removed" confirm={`Remove ${d.name}?`} detail="Its ratings, takes and photos go with it. This can't be undone." />
              </DishEditor>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

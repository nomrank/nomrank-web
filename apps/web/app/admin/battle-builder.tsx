"use client";

import { useActionState, useId, useMemo, useState } from "react";
import { MapPinIcon, SearchIcon, SwordsIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { DietMark } from "@/components/diet-mark";
import { toast } from "@/components/toaster";
import { cn } from "@/lib/utils";
import { battleCity, matchDishes, suggestTitle, type BattleDish } from "@/lib/battle-builder";
import { createBattle, type AdminResult } from "./actions";

// Make a battle in three moves: search for each side's dish, check the title it suggests, create. The two sides sit
// opposite each other the way they will in the app; the city follows from the dishes, so there's nothing else to fill in.
export function BattleBuilder({ dishes }: { dishes: BattleDish[] }) {
  const [state, action, pending] = useActionState<AdminResult, FormData>(async (prev, data) => {
    const next = await createBattle(prev, data);
    if (next.ok) toast("Battle created");
    return next;
  }, {});
  const [a, setA] = useState<BattleDish | null>(null);
  const [b, setB] = useState<BattleDish | null>(null);
  const [typed, setTyped] = useState<string | null>(null); // null until they edit the title, so it keeps following the picks
  const title = typed ?? suggestTitle(a, b);
  const city = battleCity(a, b);
  const ready = a && b && title.trim().length >= 3;

  return (
    <form key={state.ok ?? 0} action={action} className="flex flex-col gap-4">
      <div className="relative grid gap-3 md:grid-cols-2">
        <Corner side="a" label="Corner A" dish={a} other={b} dishes={dishes} onPick={setA} />
        <Corner side="b" label="Corner B" dish={b} other={a} dishes={dishes} onPick={setB} />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 z-10 hidden size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-studio text-sm font-extrabold text-spotlight shadow-[0_0_0_2px_var(--spotlight)] md:grid"
        >
          VS
        </span>
      </div>
      <input type="hidden" name="dish_a" value={a?.id ?? ""} />
      <input type="hidden" name="dish_b" value={b?.id ?? ""} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="battle-title" className="text-sm font-semibold">
          Title
        </label>
        <Input
          id="battle-title"
          name="tag"
          value={title}
          onChange={(e) => setTyped(e.target.value)}
          required
          minLength={3}
          maxLength={80}
          placeholder="Pick both dishes and a title appears"
          className="h-11 bg-raised"
        />
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon aria-hidden className="size-4 shrink-0 text-mustard" />
          {city === undefined ? "Shows in the dishes' city once you've picked both." : city ? `Shows in ${city}.` : "The dishes are in different cities, so it shows everywhere as a city war."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="xl" disabled={pending || !ready} className="sm:min-h-11">
          {pending ? <Spinner data-icon="inline-start" /> : <SwordsIcon data-icon="inline-start" />}
          Create battle
        </Button>
        {!ready && !pending && <p className="text-sm text-faint">{!a || !b ? "Pick a dish for each corner." : "Give it a title."}</p>}
      </div>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}

// One side: a search that fills in a chosen dish, which shows as a card with a way to change it.
function Corner({ side, label, dish, other, dishes, onPick }: { side: "a" | "b"; label: string; dish: BattleDish | null; other: BattleDish | null; dishes: BattleDish[]; onPick: (d: BattleDish | null) => void }) {
  const [q, setQ] = useState("");
  const listId = useId();
  const hits = useMemo(() => matchDishes(dishes, q, other?.id ?? null), [dishes, q, other]);
  const tone = side === "a" ? "border-ketchup/45 bg-ketchup/10" : "border-mustard/45 bg-mustard/10";

  return (
    <div className={cn("flex min-h-36 flex-col gap-2 rounded-2xl border p-4", tone)}>
      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</p>
      {dish ? (
        <div className="flex flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-start gap-2 text-lg leading-tight font-bold wrap-anywhere">
              <DietMark diet={dish.diet} className="mt-1.5 size-3.5 shrink-0" />
              {dish.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground wrap-anywhere">
              {dish.place}
              <span className="text-faint">
                {" "}
                · {dish.area}, {dish.city}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onPick(null);
              setQ("");
            }}
            aria-label={`Change ${label}`}
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <XIcon aria-hidden className="size-5" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              role="combobox"
              aria-expanded={hits.length > 0}
              aria-controls={listId}
              aria-label={`Search a dish for ${label}`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // Enter picks the top result rather than submitting the form
                  if (hits[0]) onPick(hits[0]);
                }
              }}
              placeholder="Dish, place or city"
              autoComplete="off"
              className="h-11 bg-background/60 pl-9"
            />
          </div>
          <ul id={listId} role="listbox" aria-label="Matching dishes" className="flex flex-col">
            {hits.map((d) => (
              <li key={d.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => onPick(d)}
                  className="flex min-h-12 w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <DietMark diet={d.diet} className="mt-1.5 size-3 shrink-0" />
                  <span className="min-w-0">
                    <span className="block font-semibold wrap-anywhere">{d.name}</span>
                    <span className="block text-sm text-muted-foreground wrap-anywhere">
                      {d.place} · {d.area}, {d.city}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {q.trim() && !hits.length && <p className="px-1 text-sm text-muted-foreground">No live dish matches that. Try a place or fewer words.</p>}
        </div>
      )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { CheckIcon } from "lucide-react";
import { SHOW_DIETS, type DishDiet, type ShowDiet } from "@/lib/diet";
import type { FeedDefault } from "@/lib/profiles";
import { cn } from "@/lib/utils";
import { DietMark } from "@/components/diet-mark";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { savePreferences, type PreferencesState } from "./actions";

const FEEDS: { value: FeedDefault; label: string; hint: string }[] = [
  { value: "top", label: "Top", hint: "Most agreed-with takes" },
  { value: "new", label: "New", hint: "Latest takes first" },
  { value: "following", label: "Following", hint: "Only people you follow" },
];

const MARKS: Record<ShowDiet, DishDiet[]> = { all: ["veg", "vegan", "egg", "non_veg"], vegan: ["vegan"], veg: ["veg", "vegan"], egg: ["veg", "vegan", "egg"] };

const OPTION =
  "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring";
const optionState = (on: boolean) => (on ? "border-mustard bg-mustard/10" : "border-hairline bg-paper hover:border-input");

export function PreferencesForm({ initial }: { initial: { show_diet: ShowDiet; feed_default: FeedDefault } }) {
  const [state, action, pending] = useActionState<PreferencesState, FormData>(savePreferences, {});
  const [show, setShow] = useState(initial.show_diet);
  const [feed, setFeed] = useState(initial.feed_default);
  const dirty = show !== initial.show_diet || feed !== initial.feed_default;

  return (
    // React resets a form after its action runs, which snaps a controlled radio back to the value it first drew. A new
    // key after each save redraws the buttons from what was saved.
    <form key={state.saved ?? 0} action={action} className="flex flex-col gap-6">
      <fieldset>
        <legend className="mb-1 font-semibold">Show dishes</legend>
        <p className="mb-3 text-sm text-muted-foreground">Filters the feed, dish lists and search. Dish pages you open directly still show everything.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {SHOW_DIETS.map((o) => (
            <label key={o.value} className={cn(OPTION, optionState(show === o.value))}>
              <input type="radio" name="show_diet" value={o.value} checked={show === o.value} onChange={() => setShow(o.value)} className="sr-only" />
              <span className="flex w-16 shrink-0 gap-0.5">
                {MARKS[o.value].map((m) => (
                  <DietMark key={m} diet={m} className="size-3.5" />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="block text-sm text-muted-foreground">{o.hint}</span>
              </span>
              {show === o.value && <CheckIcon aria-hidden className="size-4 shrink-0 text-mustard" />}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 font-semibold">Home opens on</legend>
        <div className="grid grid-cols-3 gap-2">
          {FEEDS.map((o) => (
            <label key={o.value} className={cn(OPTION, "flex-col items-start justify-center gap-0.5", optionState(feed === o.value))}>
              <input type="radio" name="feed_default" value={o.value} checked={feed === o.value} onChange={() => setFeed(o.value)} className="sr-only" />
              <span className="text-sm font-semibold">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending || !dirty}>
          {pending && <Spinner data-icon="inline-start" />}
          Save preferences
        </Button>
        {state.saved && !dirty && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckIcon aria-hidden className="size-4 animate-[check-pop_420ms_var(--ease-out)_both] text-mustard" />
            Saved
          </p>
        )}
      </div>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}

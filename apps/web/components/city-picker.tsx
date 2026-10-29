"use client";

import { useState, useTransition } from "react";
import { MapPinIcon } from "lucide-react";
import { CITIES, type City } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { setCity } from "@/app/city-actions";

// Which city to browse: a row of chips. The choice goes in a cookie for a year and the page reloads its data for it.
export function CityPicker({ city, className }: { city: City | null; className?: string }) {
  const [shown, setShown] = useState(city); // the chip lights up at once; the data follows
  const [pending, startTransition] = useTransition();

  function pick(next: City | null) {
    setShown(next);
    startTransition(() => setCity(next));
  }

  return (
    <div role="group" aria-label="City" aria-busy={pending} className={cn("-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden", className)}>
      {[null, ...CITIES].map((c) => {
        const on = shown === c;
        return (
          <button
            key={c ?? "all"}
            type="button"
            aria-pressed={on}
            onClick={() => !on && pick(c)}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-[background-color,color,border-color,transform] duration-150 ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-95",
              on ? "border-spotlight bg-spotlight text-studio" : "border-hairline text-muted-foreground hover:text-foreground",
            )}
          >
            {c === null && <MapPinIcon aria-hidden className="size-4" />}
            {c ?? "All cities"}
          </button>
        );
      })}
    </div>
  );
}

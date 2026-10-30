"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckIcon, ChevronDownIcon, MapPinIcon } from "lucide-react";
import { CITIES, type City } from "@/lib/cities";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { setCity, skipCity } from "@/app/city-actions";

// Which city you eat in: a small button that opens a sheet of the launch cities. With `ask`, the sheet opens by itself
// (first visit, or a member who hasn't picked yet) and offers "Not now".
export function CityPicker({ city, ask = false, className }: { city: City | null; ask?: boolean; className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(city); // the label changes at once; the data follows
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (ask) dialog.current?.showModal();
  }, [ask]);

  function pick(next: City) {
    setShown(next);
    dialog.current?.close();
    startTransition(() => setCity(next));
  }

  function later() {
    dialog.current?.close();
    startTransition(() => skipCity());
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-busy={pending}
        aria-label={shown ? `City: ${shown}. Change` : "Pick your city"}
        onClick={() => dialog.current?.showModal()}
        className={cn(
          "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-hairline px-3 text-sm font-semibold transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]",
          className,
        )}
      >
        {pending ? <Spinner className="size-4" /> : <MapPinIcon aria-hidden className="size-4 text-mustard" />}
        {shown ?? "Pick a city"}
        <ChevronDownIcon aria-hidden className="size-4 text-muted-foreground" />
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="city-sheet"
        className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-hairline bg-paper p-5 text-foreground backdrop:bg-studio/80 open:animate-[rise-in_220ms_var(--ease-out)] motion-reduce:animate-none"
      >
        <h2 id="city-sheet" className="text-lg font-semibold">
          Where are you eating?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Rankings, dishes and places follow your city. The feed stays all India.</p>
        <div className="mt-4 flex flex-col gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={shown === c}
              onClick={() => pick(c)}
              className={cn(
                "flex min-h-12 items-center justify-between rounded-lg border px-4 text-left font-semibold transition-[background-color,border-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.98]",
                shown === c ? "border-mustard bg-raised" : "border-input",
              )}
            >
              {c}
              {shown === c && <CheckIcon aria-hidden className="size-4 text-mustard" />}
            </button>
          ))}
        </div>
        {ask ? (
          <button type="button" onClick={later} className="mt-3 min-h-10 w-full text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            Not now
          </button>
        ) : (
          <button type="button" onClick={() => dialog.current?.close()} className="mt-3 min-h-10 w-full text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            Cancel
          </button>
        )}
      </dialog>
    </>
  );
}

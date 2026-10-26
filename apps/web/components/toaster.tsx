"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckIcon } from "lucide-react";

// Actions that land you on another page say they're done through the URL (…?done=key); the toast reads it once.
const DONE: Record<string, string> = {
  rated: "Rating posted",
  updated: "Rating updated",
  profile: "Profile saved",
  deleted: "Take deleted",
  "dish-live": "Dish added",
  "dish-pending": "Dish added. Everyone sees it once it's approved",
};
export type Done = keyof typeof DONE;

const EVENT = "nomrank:toast";

// Confirm an action that keeps you on the page ("Comment posted").
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: message }));
}

// One confirmation at a time, bottom centre: it rises in, a check pops, and it leaves on its own after ~2.4s.
// Mounted once in the root layout.
export function Toaster() {
  const done = useSearchParams().get("done");
  const [shown, setShown] = useState<{ text: string; id: number } | null>(null);

  useEffect(() => {
    const onToast = (e: Event) => setShown({ text: (e as CustomEvent<string>).detail, id: Date.now() });
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  useEffect(() => {
    if (!done) return;
    if (DONE[done]) toast(DONE[done]);
    // Drop ?done so a reload or a shared link doesn't confirm it again.
    const url = new URL(window.location.href);
    url.searchParams.delete("done");
    window.history.replaceState(window.history.state, "", url);
  }, [done]);

  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(() => setShown(null), 2400);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-50 md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] flex justify-center px-4"
    >
      {shown && (
        <p
          key={shown.id}
          className="inline-flex max-w-full animate-[toast-in_300ms_var(--ease-out)_both,toast-out_220ms_var(--ease-out)_2150ms_forwards] items-center gap-2.5 rounded-full border border-hairline bg-paper py-2 pr-4 pl-2 text-sm font-semibold shadow-[0_12px_32px_-12px_rgb(0_0_0/0.8)]"
        >
          <span aria-hidden className="grid size-6 shrink-0 animate-[check-pop_420ms_var(--ease-out)_100ms_both] place-items-center rounded-full bg-mustard text-studio">
            <CheckIcon className="size-3.5" strokeWidth={3} />
          </span>
          <span className="truncate">{shown.text}</span>
        </p>
      )}
    </div>
  );
}

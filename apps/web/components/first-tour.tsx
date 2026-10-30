"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { finishTour } from "@/app/tour-actions";

const STEPS = [
  { title: "Rate the dish, not the place", body: "Tap Rate, find the dish you ate and give it 1 to 10. Every dish gets its own score." },
  { title: "Your city, your rankings", body: "Rankings, dishes and places follow the city up top. The feed shows takes from all of India." },
  { title: "Takes and rankings", body: "Takes are what people wrote about a dish. Rankings show the best dish in each food." },
  { title: "Two dishes, one pick", body: "Battles put two dishes head to head. Vote for the one you'd order." },
];

// The first-time tour: four short cards on the home screen, once per account. Skipping counts as watching it, so it
// never comes back; closing with Escape does the same.
export function FirstTour() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();
  const last = step === STEPS.length - 1;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="tour-title"
      onClose={() => startTransition(() => finishTour())}
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-hairline bg-paper p-6 text-foreground backdrop:bg-studio/80 open:animate-[rise-in_260ms_var(--ease-out)] motion-reduce:animate-none"
    >
      <p className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">
        {step + 1} of {STEPS.length}
      </p>
      <h2 id="tour-title" key={step} className="mt-2 text-xl leading-tight font-bold tracking-tight animate-[rise-in_320ms_var(--ease-out)_both] motion-reduce:animate-none">
        {STEPS[step].title}
      </h2>
      <p className="mt-2 text-muted-foreground">{STEPS[step].body}</p>

      <div className="mt-5 flex gap-1.5" aria-hidden>
        {STEPS.map((_, i) => (
          <span key={i} className={cn("h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[var(--ease-out)]", i === step ? "w-6 bg-mustard" : "w-1.5 bg-raised")} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          className="min-h-11 rounded-md px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Skip tour
        </button>
        {last ? (
          <Button size="lg" onClick={() => dialog.current?.close()}>
            Let&apos;s eat
          </Button>
        ) : (
          <Button size="lg" onClick={() => setStep((n) => n + 1)}>
            Next
          </Button>
        )}
      </div>
    </dialog>
  );
}

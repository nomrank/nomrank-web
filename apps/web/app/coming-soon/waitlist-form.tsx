"use client";

import { useActionState } from "react";
import { ArrowRightIcon, CheckIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { joinWaitlist, type WaitlistState } from "./actions";

// The waitlist signup. `id` keeps the two copies on the page (hero and closing dialog) apart.
export function WaitlistForm({ id, className }: { id: string; className?: string }) {
  const [state, action, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, {});
  const note = `${id}-note`;

  if (state.joined)
    return (
      <div role="status" className={cn("flex animate-[rise-in_320ms_var(--ease-out)] items-start gap-3", className)}>
        <span className="grid size-10 shrink-0 animate-[check-pop_420ms_var(--ease-out)_120ms_both] place-items-center rounded-full bg-mustard text-studio">
          <CheckIcon aria-hidden className="size-5" strokeWidth={3} />
        </span>
        <div>
          <p className="text-[1.0625rem] font-semibold text-foreground">You&apos;re on the list.</p>
          <p className="mt-1 text-[1rem] text-muted-foreground">We&apos;ll email you the moment Nomrank opens.</p>
        </div>
      </div>
    );

  return (
    <form action={action} noValidate className={className}>
      <label htmlFor={id} className="sr-only">
        Email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email}
          placeholder="you@example.com"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={note}
          className="h-13 w-full min-w-0 rounded-md sm:flex-1 border border-input bg-raised px-4 text-base text-foreground caret-ketchup outline-none placeholder:text-faint focus-visible:border-mustard focus-visible:ring-2 focus-visible:ring-mustard/40 aria-invalid:border-destructive"
        />
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-md bg-ketchup px-6 text-base font-semibold text-studio transition-[background-color,transform] duration-150 ease-out outline-none hover:bg-[color-mix(in_oklab,var(--ketchup),white_10%)] focus-visible:ring-2 focus-visible:ring-mustard focus-visible:ring-offset-2 focus-visible:ring-offset-studio active:scale-[0.97] disabled:opacity-80"
        >
          {pending ? <Spinner /> : null}
          Join the waitlist
          {!pending && (
            <ArrowRightIcon
              aria-hidden
              className="size-[18px] transition-transform duration-200 ease-[var(--ease-out)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-1"
            />
          )}
        </button>
      </div>
      {/* Honeypot: off-screen and skipped by keyboard and screen readers; only bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
      <p id={note} role={state.error ? "alert" : undefined} className={cn("mt-2 text-[0.875rem]", state.error ? "text-destructive" : "text-muted-foreground")}>
        {state.error ?? "We'll email you once now to confirm, and once when we open."}
      </p>
    </form>
  );
}

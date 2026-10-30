"use client";

import { useActionState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { startSpace, type StartSpaceState } from "./actions";

// Under the rankings: start a list for a food that isn't there yet. Dishes with its name in them join it.
export function StartSpace() {
  const [state, action, pending] = useActionState<StartSpaceState, FormData>(startSpace, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-2 border-t border-hairline pt-5">
      <label htmlFor="space-name" className="text-sm font-semibold">
        Don&apos;t see your food?
      </label>
      <p className="text-sm text-muted-foreground">Start its list. Dishes with its name in them join it.</p>
      <div className="flex gap-2">
        <Input
          id="space-name"
          name="name"
          required
          maxLength={40}
          placeholder="Pani puri"
          autoComplete="off"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "space-error" : undefined}
          className="h-11 min-w-0 flex-1 bg-raised px-3.5 text-base"
        />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
          {pending ? "Starting" : "Start"}
        </Button>
      </div>
      {state.error && <FieldError id="space-error">{state.error}</FieldError>}
    </form>
  );
}

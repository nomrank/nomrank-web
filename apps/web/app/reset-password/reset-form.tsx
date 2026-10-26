"use client";

import { useActionState, useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { setPassword, type ResetState } from "./actions";

export function ResetForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(setPassword, { status: "idle" });
  const [show, setShow] = useState(false);
  const error = state.status === "error" ? state.message : null;
  return (
    <form action={action} className="flex flex-1 flex-col gap-6" noValidate>
      <div className="flex flex-col gap-3">
        <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em]">Set a new password</h1>
        <p className="text-muted-foreground">Use it next time you sign in. No more emailed links.</p>
      </div>
      <FieldGroup className="mt-auto md:mt-2">
        <Field data-invalid={error || undefined}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "reset-error" : undefined}
              required
              autoFocus
              className="h-12 bg-raised pr-12 pl-3.5 text-base"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-pressed={show}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
            >
              {show ? <EyeOffIcon aria-hidden className="size-5" /> : <EyeIcon aria-hidden className="size-5" />}
            </button>
          </div>
          {error && <FieldError id="reset-error">{error}</FieldError>}
        </Field>
        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Saving" : "Save password"}
        </Button>
      </FieldGroup>
    </form>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { adminSignIn, type AdminSignInState } from "../actions";

// Admins sign in with the email and password of their Nomrank account (the superadmin with the username "superadmin").
// There's no sign-up here. `next` sends an invited person on to their invitation afterwards.
export function AdminLogin({ next, heading = "Admin sign in" }: { next?: string; heading?: string }) {
  const [state, action, pending] = useActionState<AdminSignInState, FormData>(adminSignIn, {});
  const error = state.error ?? null;
  useEffect(() => {
    if (state.go) window.location.replace(state.go);
  }, [state.go]);
  return (
    <form action={action} noValidate className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-6 lg:mt-16">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your Nomrank email and password.</p>
      </div>
      <FieldGroup>
        <Field data-invalid={error || undefined}>
          <FieldLabel htmlFor="identifier">Email or username</FieldLabel>
          <Input
            id="identifier"
            name="identifier"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            defaultValue={state.identifier ?? ""}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "form-error" : undefined}
            className="h-12 bg-raised px-3.5 text-base"
          />
        </Field>
        <Field data-invalid={error || undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "form-error" : undefined}
            className="h-12 bg-raised px-3.5 text-base"
          />
        </Field>
        {error && <FieldError id="form-error">{error}</FieldError>}
        <Button type="submit" size="xl" className="w-full" disabled={pending}>
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Signing in" : "Sign in"}
        </Button>
        <p className="text-center text-xs text-faint">Forgot it? Reset it from the Nomrank app&apos;s sign-in screen, then come back.</p>
      </FieldGroup>
    </form>
  );
}

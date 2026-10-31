"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { GoogleMark } from "@/components/google-mark";
import { adminGoogleSignIn, adminSignIn, type AdminSignInState } from "../actions";

// Admins sign in with Google or the email and password of their Nomrank account (the superadmin with the username
// "superadmin"). There's no sign-up here. `next` sends an invited person on to their invitation afterwards; `notice` says
// why they're back here (a Google sign-in that didn't finish, or an account that isn't an admin).
export function AdminLogin({ next, heading = "Admin sign in", notice }: { next?: string; heading?: string; notice?: string }) {
  const [state, action, pending] = useActionState<AdminSignInState, FormData>(adminSignIn, {});
  const [toGoogle, startGoogle] = useTransition(); // stays on until the browser leaves for Google
  const [googleError, setGoogleError] = useState<string>();
  const error = state.error ?? googleError ?? null;
  useEffect(() => {
    if (state.go) window.location.replace(state.go);
  }, [state.go]);
  return (
    <form action={action} noValidate className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-6 lg:mt-16">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your Nomrank account.</p>
      </div>
      {notice && !error && (
        <p role="alert" className="rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
          {notice}
        </p>
      )}
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          size="xl"
          variant="secondary"
          className="w-full"
          disabled={pending || toGoogle}
          onClick={() =>
            startGoogle(async () => {
              setGoogleError(undefined);
              const result = await adminGoogleSignIn(next);
              if (result.go) window.location.assign(result.go); // a full load: the admin site keeps no client-side redirects
              else setGoogleError(result.error);
            })
          }
        >
          {toGoogle ? <Spinner data-icon="inline-start" /> : <GoogleMark />}
          {toGoogle ? "Opening Google" : "Continue with Google"}
        </Button>
        <p aria-hidden className="flex items-center gap-3 text-xs font-semibold tracking-[0.08em] text-faint uppercase before:h-px before:flex-1 before:bg-hairline after:h-px after:flex-1 after:bg-hairline">
          or
        </p>
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

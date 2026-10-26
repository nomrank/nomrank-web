"use client";

import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Screen } from "@/components/screen";
import { cn } from "@/lib/utils";
import { resendConfirm, sendReset, signIn, signUp, type LoginState } from "./actions";

type Mode = "signin" | "signup" | "reset";
const ACTIONS = { signin: signIn, signup: signUp, reset: sendReset, resend: resendConfirm };

const LABELS: Record<Mode, { button: string; busy: string }> = {
  signin: { button: "Sign in", busy: "Signing in" },
  signup: { button: "Create account", busy: "Creating" },
  reset: { button: "Email me a link", busy: "Sending" },
};

export function LoginScreen({ initialState = { status: "idle" } }: { initialState?: LoginState }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [attempt, setAttempt] = useState(0); // remounts the form so its message and fields start fresh
  const [prefill, setPrefill] = useState("");
  const go = (next: Mode, email = "") => {
    setMode(next);
    setPrefill(email);
    setAttempt((n) => n + 1);
  };
  return <LoginForm key={`${mode}-${attempt}`} mode={mode} go={go} prefill={prefill} initial={attempt === 0 ? initialState : { status: "idle" }} />;
}

function LoginForm({ mode, go, initial, prefill }: { mode: Mode; go: (m: Mode, email?: string) => void; initial: LoginState; prefill: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    (prev, data) => (ACTIONS[String(data.get("mode")) as keyof typeof ACTIONS] ?? signIn)(prev, data),
    initial,
  );
  const [show, setShow] = useState(false);
  const sentHeading = useRef<HTMLHeadingElement>(null);
  const sent = state.status === "sent";
  const wantsPassword = mode !== "reset";

  // Move focus to the confirmation so screen readers announce it.
  useEffect(() => {
    if (sent) sentHeading.current?.focus();
  }, [sent]);

  if (state.status === "sent")
    return (
      <Screen step={2}>
        <div className="flex flex-1 animate-[rise_500ms_var(--ease-out-expo)_both] flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 ref={sentHeading} tabIndex={-1} className="text-2xl leading-tight font-bold tracking-tight outline-none">
              {state.kind === "confirm" ? "Confirm your email" : "Check your inbox"}
            </h1>
            <p className="text-muted-foreground">
              {state.kind === "confirm" ? "We sent a link to " : "If "}
              <span className="font-semibold wrap-anywhere text-foreground">{state.email}</span>
              {state.kind === "confirm" ? ". Open it on any device to finish signing up." : " has an account, we sent a link to set a new password."}
            </p>
            <p className="text-sm text-muted-foreground">Nothing after a minute? Check spam, or send it again.</p>
          </div>
          <div className="mt-auto flex flex-col gap-2 md:mt-2">
            <form action={action}>
              <input type="hidden" name="mode" value={state.kind === "confirm" ? "resend" : "reset"} />
              <input type="hidden" name="email" value={state.email} />
              <Button type="submit" size="xl" variant="secondary" className="w-full" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                Send it again
              </Button>
            </form>
            <Button size="xl" variant="ghost" className="w-full" onClick={() => go(state.kind === "confirm" ? "signup" : "signin")}>
              {state.kind === "confirm" ? "Use a different email" : "Back to sign in"}
            </Button>
          </div>
        </div>
      </Screen>
    );

  const error = state.status === "error" ? state.message : null;
  return (
    <Screen step={1}>
      <form action={action} className="flex flex-1 flex-col gap-6" noValidate>
        <input type="hidden" name="mode" value={mode} />
        <div className="flex flex-col gap-3">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em]">
            {mode === "reset" ? (
              "Reset your password"
            ) : (
              <>
                Rate the <span className="text-mustard">dish</span>,<br />
                not the place.
              </>
            )}
          </h1>
          <p className="text-muted-foreground">
            {mode === "reset" ? "We'll email you a link to set a new one." : "A dish-by-dish guide to what's actually worth eating."}
          </p>
        </div>

        {wantsPassword && (
          <div role="tablist" aria-label="Sign in or create an account" className="grid grid-cols-2 gap-1 rounded-lg bg-raised p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => mode !== m && go(m)}
                className={cn(
                  "min-h-10 rounded-md text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === m ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}

        <Suspense>
          <LinkError />
        </Suspense>

        <FieldGroup className="mt-auto md:mt-2">
          <Field data-invalid={error || undefined}>
            <FieldLabel htmlFor="email">Your email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              defaultValue={state.status === "error" ? state.email : prefill}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "form-error" : undefined}
              required
              className="h-12 bg-raised px-3.5 text-base"
            />
          </Field>

          {wantsPassword && (
            <Field data-invalid={error || undefined}>
              <div className="flex items-baseline justify-between gap-3">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => go("reset")}
                    className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "form-error" : undefined}
                  required
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
            </Field>
          )}

          {error && <FieldError id="form-error">{error}</FieldError>}
          {mode === "signup" && error?.includes("already has an account") && state.status === "error" && (
            <Button type="button" size="xl" variant="secondary" className="w-full" onClick={() => go("signin", state.email)}>
              Sign in instead
            </Button>
          )}

          <Button type="submit" size="xl" className="w-full" disabled={pending}>
            {pending && <Spinner data-icon="inline-start" />}
            {pending ? LABELS[mode].busy : LABELS[mode].button}
          </Button>

          {mode === "reset" && (
            <Button type="button" size="xl" variant="ghost" className="w-full" onClick={() => go("signin")}>
              Back to sign in
            </Button>
          )}

          <p className="text-center text-xs leading-relaxed text-faint">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="font-semibold text-muted-foreground underline-offset-4 hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-semibold text-muted-foreground underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </FieldGroup>
      </form>
    </Screen>
  );
}

// Reads the URL, so it streams in on its own while the rest of the screen prerenders.
function LinkError() {
  if (useSearchParams().get("error") !== "link") return null;
  return (
    <p role="alert" className="rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
      That link expired or was already used. Sign in, or use Forgot password to get a new one.
    </p>
  );
}

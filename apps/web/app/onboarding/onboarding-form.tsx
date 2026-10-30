"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CakeIcon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Screen } from "@/components/screen";
import { DietMark } from "@/components/diet-mark";
import { DateOfBirthField } from "@/components/date-of-birth";
import { DIETS, GENDERS } from "@/lib/profiles";
import { isAtLeast13, usernameSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { RegionPicker, type PickableRegion } from "@/components/region-picker";
import { CHIP, chipState } from "@/app/settings/profile/profile-form";
import { createProfile, type OnboardingState } from "./actions";

export type Region = PickableRegion;

type Step = 1 | 2 | 3 | 4;

// Four steps: who you are (handle, name), about you (birthday, gender, food preference), where home is, what you want to eat first.
// Every step stays mounted (hidden when not current) so all answers go up in one form.
export function OnboardingForm({ regions, foods, name = "" }: { regions: Region[]; foods: string[]; name?: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createProfile, {});
  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string>();
  const [aboutError, setAboutError] = useState<string>();
  const [gender, setGender] = useState("");
  const [diet, setDiet] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [region, setRegion] = useState(regions.length === 1 ? regions[0].slug : "");
  const [seenState, setSeenState] = useState(state);
  const headingRefs = useRef<Record<Step, HTMLHeadingElement | null>>({ 1: null, 2: null, 3: null, 4: null });
  const mounted = useRef(false);

  // A server error sends you back to the step it's about.
  if (state !== seenState) {
    setSeenState(state);
    if (state.error?.field === "username") {
      setStep(1);
      setUsernameError(state.error.message);
    } else if (state.error?.field === "about") {
      setStep(2);
      setAboutError(state.error.message);
    }
  }

  useEffect(() => {
    if (mounted.current) headingRefs.current[step]?.focus();
    mounted.current = true;
  }, [step]);

  // Checks the current step before moving on; returns false to stay.
  function next(form: HTMLFormElement) {
    if (step === 1) {
      const parsed = usernameSchema.safeParse(username);
      if (!parsed.success) return setUsernameError(parsed.error.issues[0].message);
      setUsernameError(undefined);
      setStep(2);
    } else if (step === 2) {
      const dob = String(new FormData(form).get("date_of_birth") ?? "");
      if (!dob) return setAboutError("Add your date of birth.");
      if (!isAtLeast13(dob)) return setAboutError("You need to be at least 13 to use Nomrank.");
      setAboutError(undefined);
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  }

  const heading = (n: Step, text: string) => (
    <h1
      ref={(el) => {
        headingRefs.current[n] = el;
      }}
      tabIndex={-1}
      className="text-2xl leading-tight font-bold tracking-tight outline-none"
    >
      {text}
    </h1>
  );
  const stepClass = (n: Step) => cn("flex flex-1 flex-col gap-6", step === n && "animate-[rise_420ms_var(--ease-out-expo)_both]");

  return (
    <Screen step={step + 2}>
      <form
        action={action}
        onSubmit={(e) => {
          if (step < 4) {
            e.preventDefault();
            next(e.currentTarget);
          }
        }}
        className="flex flex-1 flex-col"
        noValidate
      >
        <p className="mb-3 text-xs font-semibold tracking-[0.08em] text-faint uppercase">Step {step} of 4</p>

        <div hidden={step !== 1} className={stepClass(1)}>
          <div className="flex flex-col gap-3">
            {heading(1, "Pick your handle")}
            <p className="text-muted-foreground">It&apos;s how you show up on every dish you rate.</p>
          </div>
          <FieldGroup>
            <Field data-invalid={usernameError ? true : undefined}>
              <FieldLabel htmlFor="username">Handle</FieldLabel>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(undefined);
                }}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={21}
                placeholder="dosa_devotee"
                aria-invalid={usernameError ? true : undefined}
                aria-describedby="username-help"
                className="h-12 bg-raised px-3.5 text-base"
              />
              {usernameError ? (
                <FieldError id="username-help">{usernameError}</FieldError>
              ) : (
                <FieldDescription id="username-help">3–20 letters, numbers or _.</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="display_name">
                Your name <span className="font-medium text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input id="display_name" name="display_name" defaultValue={name} maxLength={40} autoComplete="name" placeholder="Asha" className="h-12 bg-raised px-3.5 text-base" />
              <FieldDescription>Shows on your profile above your handle.</FieldDescription>
            </Field>
          </FieldGroup>
        </div>

        <div hidden={step !== 2} className={stepClass(2)}>
          <div className="flex flex-col gap-3">
            {heading(2, "A bit about you")}
            <p className="text-muted-foreground">So your takes land in context. Only your food preference is shown to others.</p>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <CakeIcon aria-hidden className="size-4 text-mustard" />
              Date of birth
            </p>
            <DateOfBirthField name="date_of_birth" defaultValue="" />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              Gender <span className="font-medium text-muted-foreground">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map((g) => (
                <label key={g.value} className={cn(CHIP, chipState(gender === g.value))}>
                  <input type="radio" name="gender" value={g.value} checked={gender === g.value} onChange={() => setGender(g.value)} className="sr-only" />
                  {g.label}
                </label>
              ))}
            </div>
            {!gender && <input type="hidden" name="gender" value="" />}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">
              Food preference <span className="font-medium text-muted-foreground">(optional)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {DIETS.map((d) => (
                <label key={d.value} className={cn(CHIP, chipState(diet === d.value))}>
                  <input type="radio" name="diet" value={d.value} checked={diet === d.value} onChange={() => setDiet(d.value)} className="sr-only" />
                  <DietMark diet={d.mark} className="size-3" />
                  {d.label}
                </label>
              ))}
            </div>
            {!diet && <input type="hidden" name="diet" value="" />}
          </fieldset>
          {aboutError && <FieldError className="text-base">{aboutError}</FieldError>}
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <LockIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-mustard" />
            Your birthday and gender stay private. We ask for your birthday to make sure you&apos;re 13 or older.
          </p>
        </div>

        <div hidden={step !== 3} className={stepClass(3)}>
          <div className="flex flex-col gap-3">
            {heading(3, "Where's home?")}
            <p className="text-muted-foreground">
              Where you grew up eating. When a dish comes from there, your rating counts toward its Tastes&nbsp;like&nbsp;home score.
            </p>
          </div>
          <FieldSet data-invalid={state.error?.field === "region" || undefined}>
            <FieldLegend className="sr-only">Home</FieldLegend>
            <RegionPicker regions={regions} value={region} onChange={setRegion} name="region" />
            {regions.length === 0 ? (
              <FieldError>Couldn&apos;t load places. Refresh the page to try again.</FieldError>
            ) : state.error?.field === "region" ? (
              <FieldError>{state.error.message}</FieldError>
            ) : (
              <FieldDescription>You can change it later, once every 30 days.</FieldDescription>
            )}
          </FieldSet>
        </div>

        <div hidden={step !== 4} className={stepClass(4)}>
          <div className="flex flex-col gap-3">
            {heading(4, "What are you hungry for?")}
            <p className="text-muted-foreground">Pick a few. We&apos;ll open the best of the first one right after this.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {foods.map((f) => (
              <label key={f} className={cn(CHIP, chipState(picked.includes(f)))}>
                <input
                  type="checkbox"
                  name="food"
                  value={f}
                  checked={picked.includes(f)}
                  onChange={() => setPicked((p) => (p.includes(f) ? p.filter((x) => x !== f) : [...p, f]))}
                  className="sr-only"
                />
                {f}
              </label>
            ))}
          </div>
          {state.error?.field === "form" && (
            <p role="alert" className="text-sm text-destructive">
              {state.error.message}
            </p>
          )}
        </div>

        <input type="hidden" name="username" value={username} />
        <div className="mt-8 flex gap-2">
          {step > 1 && (
            <Button type="button" size="xl" variant="ghost" onClick={() => setStep((step - 1) as Step)} disabled={pending}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back
            </Button>
          )}
          <Button type="submit" size="xl" className="flex-1" disabled={pending || (step === 3 && (regions.length === 0 || !region))}>
            {step < 4 ? "Next" : pending ? "Saving" : picked.length ? "Let's eat" : "Skip, let's eat"}
            {pending ? <Spinner data-icon="inline-end" /> : step < 4 && <ArrowRightIcon data-icon="inline-end" />}
          </Button>
        </div>
      </form>
    </Screen>
  );
}

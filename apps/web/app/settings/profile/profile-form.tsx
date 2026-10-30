"use client";

import { useActionState, useRef, useState } from "react";
import { AtSignIcon, GlobeIcon, ImagePlusIcon, LockIcon, ShuffleIcon, Trash2Icon } from "lucide-react";
import { avatarTraits, COLOURS, encodeAvatar, EYES, MOUTHS, SHAPES, type Traits } from "@/lib/avatar";
import { DIETS, GENDERS } from "@/lib/profiles";
import { cropSquareJpeg } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { RegionPicker, type PickableRegion } from "@/components/region-picker";
import { Avatar } from "@/components/avatar";
import { DietMark } from "@/components/diet-mark";
import { DateOfBirthField } from "@/components/date-of-birth";
import { Button } from "@/components/ui/button";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { updateProfile, type ProfileFormState } from "./actions";

type Props = {
  userId: string;
  handle: string;
  regions: PickableRegion[];
  regionLockedUntil: string | null; // "21 November" while a recent change locks the home region, else null
  initial: {
    display_name: string;
    bio: string;
    avatar: string | null;
    avatar_path: string | null;
    diet: string;
    instagram: string;
    date_of_birth: string;
    gender: string;
    home_region: string;
  };
};

const MAX_BIO = 160;

const TRAITS = [
  { key: "shape", label: "Shape", count: SHAPES.length, names: SHAPES },
  {
    key: "colour",
    label: "Colour",
    count: COLOURS.length,
    names: COLOURS.map((c) => c.name),
  },
  { key: "eyes", label: "Eyes", count: EYES.length, names: EYES },
  { key: "mouth", label: "Mouth", count: MOUTHS.length, names: MOUTHS },
] as const;

export const CHIP =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring";
export const chipState = (on: boolean) => (on ? "border-mustard bg-mustard/10" : "border-input bg-raised hover:border-foreground/40");

export function ProfileForm({ userId, handle, regions, regionLockedUntil, initial }: Props) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});
  const [traits, setTraits] = useState<Traits>(() => avatarTraits(initial.avatar, handle));
  const [photo, setPhoto] = useState(initial.avatar_path);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string>();
  const [bio, setBio] = useState(initial.bio);
  const [diet, setDiet] = useState(initial.diet);
  const [gender, setGender] = useState(initial.gender);
  const [region, setRegion] = useState(initial.home_region);
  const [traitTab, setTraitTab] = useState<(typeof TRAITS)[number]["key"]>("shape");
  const fileRef = useRef<HTMLInputElement>(null);
  const code = encodeAvatar(traits);

  // A photo uploaded here but not saved yet is ours to clean up if it's replaced or removed.
  function discardUnsaved(path: string | null) {
    if (path && path !== initial.avatar_path) void createClient().storage.from("avatars").remove([path]);
  }

  async function pickPhoto(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setPhotoError(undefined);
    setUploading(true);
    try {
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient()
        .storage.from("avatars")
        .upload(path, await cropSquareJpeg(file), {
          contentType: "image/jpeg",
        });
      if (error) throw error;
      discardUnsaved(photo);
      setPhoto(path);
    } catch {
      setPhotoError("That photo didn't upload. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function shuffle() {
    setTraits({
      shape: Math.floor(Math.random() * SHAPES.length),
      colour: Math.floor(Math.random() * COLOURS.length),
      eyes: Math.floor(Math.random() * EYES.length),
      mouth: Math.floor(Math.random() * MOUTHS.length),
    });
  }

  return (
    // Desktop: the picture maker pinned on the left, the details in cards on the right. Phones: one column.
    <form action={action} className="pb-10 lg:grid lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-14">
      <input type="hidden" name="avatar" value={code} />
      <input type="hidden" name="avatar_path" value={photo ?? ""} />

      {/* Picture: an uploaded photo, or the food character (which also shows when there's no photo). */}
      <section aria-labelledby="picture-title" className="rounded-2xl border border-hairline bg-paper p-4 sm:p-5 lg:sticky lg:top-6">
        <h2 id="picture-title" className="text-sm font-semibold">
          Profile picture
        </h2>
        <div className="mt-3 flex items-center gap-5">
          <span className="relative grid size-28 shrink-0 place-items-center rounded-2xl border border-hairline bg-raised">
            <Avatar
              key={photo ?? code}
              handle={handle}
              code={code}
              photo={photo}
              size={photo ? 104 : 96}
              label="Your profile picture preview"
              className="animate-[rise-in_220ms_var(--ease-out)]"
            />
            {uploading && (
              <span className="absolute inset-0 grid place-items-center rounded-2xl bg-studio/70">
                <Spinner />
              </span>
            )}
          </span>
          <div className="flex flex-col items-start gap-2">
            <Button type="button" variant="secondary" size="lg" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlusIcon data-icon="inline-start" />
              {photo ? "Change photo" : "Upload photo"}
            </Button>
            {photo ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={uploading}
                onClick={() => {
                  discardUnsaved(photo);
                  setPhoto(null);
                }}
              >
                <Trash2Icon data-icon="inline-start" />
                Use my character
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="lg" onClick={shuffle}>
                <ShuffleIcon data-icon="inline-start" />
                Shuffle character
              </Button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        </div>
        {photoError && <FieldError className="mt-2">{photoError}</FieldError>}

        <div className="mt-5">
          <p className="text-xs text-muted-foreground">
            {photo ? "Your character shows only if you remove the photo." : "Build your character, or upload a photo instead."}
          </p>
          {/* One trait at a time behind tabs, so the maker stays a single row tall. */}
          <div className={cn("mt-3", photo && "opacity-60")}>
            <div role="tablist" aria-label="Character traits" className="grid grid-cols-4 gap-1 rounded-xl bg-raised p-1">
              {TRAITS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  id={`trait-tab-${key}`}
                  aria-selected={traitTab === key}
                  aria-controls={`trait-panel-${key}`}
                  onClick={() => setTraitTab(key)}
                  className={cn(
                    "min-h-9 rounded-lg text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    traitTab === key ? "bg-paper text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {TRAITS.filter(({ key }) => key === traitTab).map(({ key, label, count, names }) => (
              <fieldset
                key={key}
                id={`trait-panel-${key}`}
                role="tabpanel"
                aria-labelledby={`trait-tab-${key}`}
                className="mt-3 animate-[fade-in_180ms_var(--ease-out)]"
              >
                <legend className="sr-only">{label}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: count }, (_, i) => {
                    const option = { ...traits, [key]: i };
                    const selected = traits[key] === i;
                    return (
                      <label
                        key={i}
                        className={cn(
                          "grid size-12 cursor-pointer place-items-center rounded-xl border bg-raised transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                          selected ? "border-mustard bg-mustard/10" : "border-transparent hover:border-input",
                        )}
                      >
                        <input
                          type="radio"
                          name={`trait-${key}`}
                          checked={selected}
                          onChange={() => setTraits(option)}
                          aria-label={`${label}: ${names[i]}`}
                          className="sr-only"
                        />
                        {key === "colour" ? (
                          <span aria-hidden className="size-7 rounded-full" style={{ background: COLOURS[i].fill }} />
                        ) : (
                          <Avatar handle={handle} code={encodeAvatar(option)} size={38} />
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-6 lg:mt-0">
        <section aria-labelledby="public-title" className="rounded-2xl border border-hairline bg-paper p-4 sm:p-5">
          <h2 id="public-title" className="flex items-center gap-2 text-sm font-semibold">
            <GlobeIcon aria-hidden className="size-4 text-mustard" />
            On your profile
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="display_name" className="font-semibold">
                Name <span className="font-medium text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={initial.display_name}
                maxLength={40}
                autoComplete="name"
                placeholder={`@${handle}`}
                className="h-12 bg-raised px-3.5 text-base"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="instagram" className="font-semibold">
                Instagram <span className="font-medium text-muted-foreground">(optional)</span>
              </FieldLabel>
              <div className="relative">
                <AtSignIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="instagram"
                  name="instagram"
                  defaultValue={initial.instagram}
                  maxLength={80}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="yourhandle"
                  className="h-12 bg-raised pr-3.5 pl-10 text-base"
                />
              </div>
              <FieldDescription>Your handle or a link to your profile.</FieldDescription>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="bio" className="font-semibold">
                Bio <span className="font-medium text-muted-foreground">(optional)</span>
              </FieldLabel>
              <AutoTextarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                rows={3}
                placeholder="What you'd cross the city for."
                aria-describedby="bio-count"
                className="w-full rounded-md border border-input bg-raised px-3.5 py-3 text-base leading-relaxed focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
              <p id="bio-count" className="text-right text-sm text-muted-foreground tabular-nums">
                {bio.length}/{MAX_BIO}
              </p>
            </Field>

            <fieldset className="sm:col-span-2">
              <legend className="mb-1 text-sm font-semibold">
                Food preference <span className="font-medium text-muted-foreground">(optional)</span>
              </legend>
              <p className="mb-3 text-sm text-muted-foreground">Shows on your profile, so people read your takes in context.</p>
              <div className="flex flex-wrap gap-2">
                {[...DIETS, { value: "", label: "Not saying" }].map((d) => (
                  <label key={d.value || "none"} className={cn(CHIP, chipState(diet === d.value))}>
                    <input type="radio" name="diet" value={d.value} checked={diet === d.value} onChange={() => setDiet(d.value)} className="sr-only" />
                    {"mark" in d && <DietMark diet={d.mark} className="size-3" />}
                    {d.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset disabled={regionLockedUntil !== null} className="sm:col-span-2">
              <legend className="mb-1 text-sm font-semibold">Home region</legend>
              <p className="mb-3 text-sm text-muted-foreground">
                {regionLockedUntil
                  ? `You changed it recently. You can change it again from ${regionLockedUntil}.`
                  : "Where your home food is from. It powers Tastes like home, and you can change it once every 30 days."}
              </p>
              {regionLockedUntil && <input type="hidden" name="home_region" value={initial.home_region} />}
              <RegionPicker regions={regions} value={region} onChange={setRegion} name="home_region" className={cn(regionLockedUntil && "pointer-events-none opacity-60")} />
              {!regionLockedUntil && region !== initial.home_region && (
                <p className="mt-2 text-sm text-mustard">Once saved, you can&apos;t change it again for 30 days.</p>
              )}
            </fieldset>
          </div>
        </section>

        {/* Private: stored in an owner-only table; never shown to anyone else. */}
        <section aria-labelledby="private-title" className="rounded-2xl border border-hairline bg-paper p-4 sm:p-5">
          <h2 id="private-title" className="flex items-center gap-2 text-sm font-semibold">
            <LockIcon aria-hidden className="size-4 text-mustard" />
            Only you can see these
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">
                Date of birth <span className="font-medium text-muted-foreground">(optional)</span>
              </p>
              <DateOfBirthField name="date_of_birth" defaultValue={initial.date_of_birth} />
            </div>
            <fieldset>
              <legend className="mb-3 text-sm font-semibold">
                Gender <span className="font-medium text-muted-foreground">(optional)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {GENDERS.map((g) => (
                  <label key={g.value} className={cn(CHIP, chipState(gender === g.value))}>
                    <input type="radio" name="gender" value={g.value} checked={gender === g.value} onChange={() => setGender(g.value)} className="sr-only" />
                    {g.label}
                  </label>
                ))}
                {gender && (
                  <button type="button" onClick={() => setGender("")} className="min-h-10 px-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                    Clear
                  </button>
                )}
              </div>
              {/* Radios send nothing when none is picked; this keeps "cleared" explicit. */}
              {!gender && <input type="hidden" name="gender" value="" />}
            </fieldset>
          </div>
        </section>

        {state.error && <FieldError className="text-base">{state.error}</FieldError>}

        <Button type="submit" size="xl" className="w-full sm:w-auto sm:self-end sm:px-10" disabled={pending || uploading}>
          {pending && <Spinner data-icon="inline-start" />}
          {pending ? "Saving" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

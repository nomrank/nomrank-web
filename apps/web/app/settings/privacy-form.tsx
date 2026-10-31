"use client";

import { useActionState, useState } from "react";
import { BookOpenIcon, BookmarkIcon, GlobeIcon, LockIcon, UserCheckIcon, UsersIcon, UsersRoundIcon } from "lucide-react";
import { VISIBILITIES, type Visibility } from "@/lib/profiles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/toaster";
import { savePrivacy, type PrivacyState } from "./actions";

const ICONS = { everyone: GlobeIcon, followers: UsersRoundIcon, only_me: LockIcon } satisfies Record<Visibility, unknown>;

type Initial = { saves_visibility: Visibility; diary_visibility: Visibility; followers_visibility: Visibility; following_visibility: Visibility };

const LISTS = [
  {
    name: "saves_visibility",
    question: "Who can see your Want to try list",
    icon: BookmarkIcon,
    hint: "The dishes you've saved for later.",
  },
  {
    name: "diary_visibility",
    question: "Who can see your Diary",
    icon: BookOpenIcon,
    hint: "Your rating history by date. Your scores and takes still show on dish pages.",
  },
  {
    name: "followers_visibility",
    question: "Who can see your followers",
    icon: UsersIcon,
    hint: "The list of people who follow you. The number on your profile always shows.",
  },
  {
    name: "following_visibility",
    question: "Who can see who you follow",
    icon: UserCheckIcon,
    hint: "The list of people you follow. The number on your profile always shows.",
  },
] as const;

// Who sees your Want to try list, Diary, followers and following: a three-way switch for each, saved together.
export function PrivacyForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<PrivacyState, FormData>(async (prev, data) => {
    const next = await savePrivacy(prev, data);
    if (next.saved !== prev.saved) toast("Privacy saved");
    return next;
  }, {});
  const [values, setValues] = useState(initial);
  const dirty = LISTS.some(({ name }) => values[name] !== initial[name]);

  return (
    // React resets a form after its action runs, which snaps a controlled radio back to the value it first drew. A new
    // key after each save redraws the buttons from what was saved.
    <form key={state.saved ?? 0} action={action} className="flex flex-col gap-5">
      {LISTS.map(({ name, question, icon: Icon, hint }) => (
        <fieldset key={name}>
          <legend className="flex items-center gap-2 text-sm font-semibold">
            <Icon aria-hidden className="size-4 text-mustard" />
            {question}
          </legend>
          <p className="mt-1 mb-2.5 text-sm text-muted-foreground">{hint}</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-hairline bg-raised p-1">
            {VISIBILITIES.map((v) => {
              const on = values[name] === v.value;
              const VIcon = ICONS[v.value];
              return (
                <label
                  key={v.value}
                  className={cn(
                    "flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring",
                    on ? "bg-mustard text-studio" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name={name}
                    value={v.value}
                    checked={on}
                    onChange={() => setValues({ ...values, [name]: v.value })}
                    className="sr-only"
                  />
                  <VIcon aria-hidden className="size-3.5 shrink-0" />
                  {v.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={pending || !dirty}>
          {pending && <Spinner data-icon="inline-start" />}
          Save privacy
        </Button>
        <p className="text-xs text-faint">&ldquo;Followers&rdquo; means people who follow you.</p>
      </div>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}

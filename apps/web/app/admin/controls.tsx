"use client";

import { useActionState, useState, useTransition } from "react";
import { BanIcon, CheckIcon, PlusIcon, ShieldOffIcon, Trash2Icon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/toaster";
import { addRestaurant, setBan, type AdminResult } from "./actions";
import { CITIES } from "@/lib/cities";

const ICONS = { approve: CheckIcon, remove: Trash2Icon, dismiss: XIcon } as const;

type ActionProps = {
  run: (...args: never[]) => Promise<AdminResult>; // a server action from ./actions
  args: unknown[];
  label: string;
  icon: keyof typeof ICONS;
  done: string; // the toast once it worked
  confirm?: string; // ask first ("Remove this take?") for anything that can't be undone
  tone?: "primary" | "danger" | "quiet";
};

// One admin action as a button. Destructive ones ask first, inline: "Remove this take? Remove · Cancel".
export function ActionButton({ run, args, label, icon, done, confirm, tone = "quiet" }: ActionProps) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string>();
  const Icon = ICONS[icon];
  const go = () =>
    start(async () => {
      const result = await (run as (...a: unknown[]) => Promise<AdminResult>)(...args);
      setAsking(false);
      if (result.error) return setError(result.error);
      toast(done);
    });
  const variant = tone === "primary" ? "default" : tone === "danger" ? "destructive" : "secondary";

  if (asking)
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{confirm}</span>
        <Button type="button" size="lg" variant="destructive" disabled={pending} onClick={go}>
          {pending ? <Spinner data-icon="inline-start" /> : <Icon data-icon="inline-start" />}
          {label}
        </Button>
        <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => setAsking(false)}>
          Cancel
        </Button>
      </span>
    );
  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" size="lg" variant={variant} disabled={pending} onClick={() => (confirm ? setAsking(true) : go())}>
        {pending ? <Spinner data-icon="inline-start" /> : <Icon data-icon="inline-start" />}
        {label}
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </span>
  );
}

// Ban: a reason (kept in the admin-only log) and, optionally, delete everything they've posted. Unban is one click.
export function BanControls({ account, handle, banned }: { account: string; handle: string; banned: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [purge, setPurge] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const apply = (ban: boolean) =>
    start(async () => {
      const result = await setBan(account, ban, reason, purge);
      if (result.error) return setError(result.error);
      setOpen(false);
      toast(ban ? `@${handle} is banned` : `@${handle} can post again`);
    });

  if (banned)
    return (
      <Button type="button" size="lg" variant="secondary" disabled={pending} onClick={() => apply(false)}>
        {pending ? <Spinner data-icon="inline-start" /> : <ShieldOffIcon data-icon="inline-start" />}
        Unban
      </Button>
    );
  if (!open)
    return (
      <Button type="button" size="lg" variant="destructive" onClick={() => setOpen(true)}>
        <BanIcon data-icon="inline-start" />
        Ban @{handle}
      </Button>
    );
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-destructive/40 p-3">
      <p className="text-sm font-semibold">Ban @{handle}?</p>
      <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason (only admins see it)" className="h-10 bg-raised" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={purge} onChange={(e) => setPurge(e.target.checked)} className="size-4 accent-[var(--ketchup)]" />
        Also delete all their takes and comments
      </label>
      {error && <FieldError>{error}</FieldError>}
      <div className="flex gap-2">
        <Button type="button" size="lg" variant="destructive" disabled={pending} onClick={() => apply(true)}>
          {pending ? <Spinner data-icon="inline-start" /> : <BanIcon data-icon="inline-start" />}
          Ban account
        </Button>
        <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function AddRestaurantForm() {
  const [state, action, pending] = useActionState<AdminResult, FormData>(async (prev, data) => {
    const next = await addRestaurant(prev, data);
    if (next.ok) toast("Restaurant added");
    return next;
  }, {});
  return (
    <form key={state.ok ?? 0} action={action} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
      <Input name="name" required maxLength={80} placeholder="Restaurant name" aria-label="Restaurant name" className="h-11 bg-raised sm:flex-1" />
      <Input name="area" required maxLength={60} placeholder="Area, e.g. Jayanagar" aria-label="Area" className="h-11 bg-raised sm:w-56" />
      <select
        name="city"
        required
        defaultValue=""
        aria-label="City"
        className="h-11 rounded-md border border-input bg-raised px-3 text-base focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-40"
      >
        <option value="" disabled>
          City
        </option>
        {CITIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <Button type="submit" size="xl" disabled={pending} className={cn("sm:min-h-11")}>
        {pending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
        Add restaurant
      </Button>
      {state.error && <FieldError className="sm:basis-full">{state.error}</FieldError>}
    </form>
  );
}

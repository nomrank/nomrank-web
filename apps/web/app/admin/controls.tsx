"use client";

import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { BanIcon, CheckIcon, MapPinIcon, PlusIcon, ShieldOffIcon, Trash2Icon, XIcon } from "lucide-react";
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
  confirm?: string; // the question a pop-up asks first ("Remove this take?"); every admin action that changes something has one
  detail?: string; // one line under the question: what exactly happens
  tone?: "primary" | "danger" | "quiet";
};

// A modal that asks before an admin action runs. Native <dialog>: focus is trapped, Esc and the backdrop close it, and focus
// goes back to the button that opened it.
function ConfirmDialog({ open, onClose, title, detail, children }: { open: boolean; onClose: () => void; title: string; detail?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-hairline bg-paper p-5 text-foreground shadow-2xl backdrop:animate-[fade-in_200ms_var(--ease-out)] backdrop:bg-studio/80 backdrop:backdrop-blur-sm open:animate-[rise-in_220ms_var(--ease-out)_both] motion-reduce:animate-none"
    >
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      {detail && <p className="mt-1.5 text-sm text-muted-foreground">{detail}</p>}
      {children}
    </dialog>
  );
}

// One admin action as a button. With a question set, it opens a pop-up and only runs once the admin confirms.
export function ActionButton({ run, args, label, icon, done, confirm, detail, tone = "quiet" }: ActionProps) {
  const [pending, start] = useTransition();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string>();
  const Icon = ICONS[icon];
  const go = () =>
    start(async () => {
      const result = await (run as (...a: unknown[]) => Promise<AdminResult>)(...args);
      if (result.error) {
        setAsking(false);
        return setError(result.error);
      }
      setAsking(false);
      toast(done);
    });
  const variant = tone === "primary" ? "default" : tone === "danger" ? "destructive" : "secondary";
  const risky = tone === "danger" || icon === "remove";

  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" size="lg" variant={variant} disabled={pending} onClick={() => (confirm ? setAsking(true) : go())}>
        {pending && !asking ? <Spinner data-icon="inline-start" /> : <Icon data-icon="inline-start" />}
        {label}
      </Button>
      {error && <FieldError>{error}</FieldError>}
      {confirm && (
        <ConfirmDialog open={asking} onClose={() => !pending && setAsking(false)} title={confirm} detail={detail}>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={() => setAsking(false)}>
              Go back
            </Button>
            <Button type="button" size="lg" variant={risky ? "destructive" : "default"} disabled={pending} onClick={go}>
              {pending ? <Spinner data-icon="inline-start" /> : <Icon data-icon="inline-start" />}
              {label}
            </Button>
          </div>
        </ConfirmDialog>
      )}
    </span>
  );
}

// Ban: opens a pop-up for a reason (kept in the admin-only log) and, optionally, deleting everything they've posted. Unban asks too.
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
  const close = () => !pending && setOpen(false);

  return (
    <>
      <Button type="button" size="lg" variant={banned ? "secondary" : "destructive"} onClick={() => setOpen(true)}>
        {banned ? <ShieldOffIcon data-icon="inline-start" /> : <BanIcon data-icon="inline-start" />}
        {banned ? "Unban" : `Ban @${handle}`}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={close}
        title={banned ? `Unban @${handle}?` : `Ban @${handle}?`}
        detail={banned ? "They can rate, comment and vote again straight away." : "They can't rate, comment or vote while banned. You can unban them later."}
      >
        {!banned && (
          <div className="mt-4 flex flex-col gap-3">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason (only admins see it)" aria-label="Reason" className="h-10 bg-raised" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={purge} onChange={(e) => setPurge(e.target.checked)} className="size-4 accent-[var(--ketchup)]" />
              Also delete all their takes and comments
            </label>
          </div>
        )}
        {error && <FieldError className="mt-3">{error}</FieldError>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" size="lg" variant="ghost" disabled={pending} onClick={close}>
            Cancel
          </Button>
          <Button type="button" size="lg" variant={banned ? "default" : "destructive"} disabled={pending} onClick={() => apply(!banned)}>
            {pending ? <Spinner data-icon="inline-start" /> : banned ? <ShieldOffIcon data-icon="inline-start" /> : <BanIcon data-icon="inline-start" />}
            {banned ? "Unban account" : "Ban account"}
          </Button>
        </div>
      </ConfirmDialog>
    </>
  );
}

// Add a restaurant: the fields on one side, and on the other a live card of how it will look on Nomrank. The city is four
// chips (the launch cities), not a dropdown, and the button stays off until the card is complete.
export function AddRestaurantForm() {
  const [state, action, pending] = useActionState<AdminResult, FormData>(async (prev, data) => {
    const next = await addRestaurant(prev, data);
    if (next.ok) toast("Restaurant added");
    return next;
  }, {});
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const ready = name.trim().length > 1 && area.trim().length > 1 && city !== "";

  return (
    <form
      key={state.ok ?? 0}
      action={action}
      onSubmit={(e) => !ready && e.preventDefault()}
      className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] lg:gap-8"
    >
      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">Name</span>
          <Input name="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Roti Ghar" autoComplete="off" className="h-12 bg-raised text-base" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">Area</span>
          <Input name="area" required maxLength={60} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Jayanagar" autoComplete="off" className="h-12 bg-raised text-base" />
        </label>
        <fieldset>
          <legend className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-faint uppercase">City</legend>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => (
              <label
                key={c}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors duration-150 has-focus-visible:ring-2 has-focus-visible:ring-ring",
                  city === c ? "border-mustard bg-mustard/15 text-foreground" : "border-hairline bg-paper text-muted-foreground hover:border-input hover:text-foreground",
                )}
              >
                <input type="radio" name="city" value={c} required checked={city === c} onChange={() => setCity(c)} className="sr-only" />
                {city === c && <CheckIcon aria-hidden className="size-4 text-mustard" strokeWidth={3} />}
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        {state.error && <FieldError>{state.error}</FieldError>}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold tracking-[0.08em] text-faint uppercase">How it will look</p>
        <div aria-hidden className="relative overflow-hidden rounded-2xl border border-hairline bg-raised/60 p-4">
          <span className="absolute -top-8 -right-8 size-28 rounded-full bg-mustard/15 blur-2xl" />
          <span className="relative grid size-12 place-items-center rounded-xl bg-primary text-xl font-extrabold text-primary-foreground">{name.trim().charAt(0).toUpperCase() || "?"}</span>
          <p className={cn("relative mt-3 truncate text-lg font-bold", !name.trim() && "text-faint")}>{name.trim() || "Restaurant name"}</p>
          <p className="relative mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">{[area.trim() || "Area", city || "City"].join(", ")}</span>
          </p>
          <p className="relative mt-4 border-t border-hairline pt-3 text-xs text-faint">No dishes yet. Add them after it&apos;s saved.</p>
        </div>
        <Button type="submit" size="xl" disabled={pending || !ready} className="w-full">
          {pending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
          Add restaurant
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckIcon, MailPlusIcon, PencilIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { DietMark } from "@/components/diet-mark";
import { toast } from "@/components/toaster";
import { CITIES } from "@/lib/cities";
import { DISH_DIETS, type DishDiet } from "@/lib/diet";
import { adminSignOut, addDish, changePassword, updateDish, updateMyName, updateRestaurant, inviteAdmin, type AdminResult } from "./actions";

const SELECT =
  "h-11 rounded-md border border-input bg-raised px-3 text-base focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

// A server action as a form: a toast when it works, the error under the fields when it doesn't.
function useAdminForm(run: (prev: AdminResult, data: FormData) => Promise<AdminResult>, done: string, onDone?: () => void) {
  return useActionState<AdminResult, FormData>(async (prev, data) => {
    const next = await run(prev, data);
    if (next.ok) {
      toast(done);
      onDone?.();
    }
    return next;
  }, {});
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="xl" disabled={pending} className="sm:min-h-11">
      {pending ? <Spinner data-icon="inline-start" /> : <CheckIcon data-icon="inline-start" />}
      {children}
    </Button>
  );
}

export function EditRestaurantForm({ place }: { place: { id: string; name: string; area: string; city: string } }) {
  const [state, action, pending] = useAdminForm(updateRestaurant, "Restaurant saved");
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
      <input type="hidden" name="id" value={place.id} />
      <Input name="name" required maxLength={80} defaultValue={place.name} aria-label="Restaurant name" className="h-11 bg-raised sm:flex-1" />
      <Input name="area" required maxLength={60} defaultValue={place.area} aria-label="Area" className="h-11 bg-raised sm:w-48" />
      <select name="city" defaultValue={place.city} aria-label="City" className={`${SELECT} sm:w-40`}>
        {CITIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <Submit pending={pending}>Save</Submit>
      {state.error && <FieldError className="sm:basis-full">{state.error}</FieldError>}
    </form>
  );
}

function DietSelect({ value }: { value?: DishDiet }) {
  return (
    <select name="diet" required defaultValue={value ?? ""} aria-label="Diet" className={`${SELECT} sm:w-36`}>
      <option value="" disabled>
        Diet
      </option>
      {DISH_DIETS.map((d) => (
        <option key={d.value} value={d.value}>
          {d.label}
        </option>
      ))}
    </select>
  );
}

export function AddDishForm({ restaurantId }: { restaurantId: string }) {
  const [state, action, pending] = useAdminForm(addDish, "Dish added");
  return (
    <form key={state.ok ?? 0} action={action} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
      <input type="hidden" name="restaurant_id" value={restaurantId} />
      <Input name="name" required maxLength={60} placeholder="Dish name, e.g. Masala Dosa" aria-label="Dish name" className="h-11 bg-raised sm:flex-1" />
      <DietSelect />
      <Button type="submit" size="xl" disabled={pending} className="sm:min-h-11">
        {pending ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
        Add dish
      </Button>
      {state.error && <FieldError className="sm:basis-full">{state.error}</FieldError>}
    </form>
  );
}

// A dish on the menu: its name and mark, with an Edit that turns the row into a small form.
export function DishEditor({ dish, children }: { dish: { id: string; name: string; diet: DishDiet }; children?: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useAdminForm(updateDish, "Dish saved", () => setEditing(false));
  if (editing)
    return (
      <form action={action} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <input type="hidden" name="id" value={dish.id} />
        <Input name="name" required maxLength={60} defaultValue={dish.name} aria-label="Dish name" autoFocus className="h-11 bg-raised sm:flex-1" />
        <DietSelect value={dish.diet} />
        <Submit pending={pending}>Save</Submit>
        <Button type="button" size="xl" variant="ghost" onClick={() => setEditing(false)} className="sm:min-h-11">
          Cancel
        </Button>
        {state.error && <FieldError className="sm:basis-full">{state.error}</FieldError>}
      </form>
    );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DietMark diet={dish.diet} className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 font-semibold wrap-anywhere">{dish.name}</span>
      <Button type="button" size="lg" variant="secondary" onClick={() => setEditing(true)}>
        <PencilIcon data-icon="inline-start" />
        Edit
      </Button>
      {children}
    </div>
  );
}

export function InviteAdminForm() {
  const [state, action, pending] = useAdminForm(inviteAdmin, "Invitation sent");
  return (
    <form key={state.ok ?? 0} action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Input name="email" type="email" required maxLength={254} autoComplete="off" placeholder="Their email address" aria-label="Email address to invite" className="h-11 bg-raised sm:max-w-sm" />
      <Button type="submit" size="xl" disabled={pending} className="sm:min-h-11">
        {pending ? <Spinner data-icon="inline-start" /> : <MailPlusIcon data-icon="inline-start" />}
        Send invitation
      </Button>
      {state.error && <FieldError className="sm:basis-full">{state.error}</FieldError>}
    </form>
  );
}

export function NameForm({ name }: { name: string | null }) {
  const [state, action, pending] = useAdminForm(updateMyName, "Name saved");
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Input name="display_name" maxLength={40} defaultValue={name ?? ""} placeholder="Your name" aria-label="Display name" className="h-11 bg-raised sm:max-w-xs" />
      <Submit pending={pending}>Save name</Submit>
      {state.error && <FieldError className="sm:basis-full">{state.error}</FieldError>}
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useAdminForm(changePassword, "Password changed");
  return (
    <form key={state.ok ?? 0} action={action} className="flex max-w-sm flex-col gap-3">
      <Input name="password" type="password" required autoComplete="new-password" placeholder="New password (8+ characters)" aria-label="New password" className="h-11 bg-raised" />
      <Input name="confirm" type="password" required autoComplete="new-password" placeholder="Type it again" aria-label="Confirm new password" className="h-11 bg-raised" />
      <Submit pending={pending}>Change password</Submit>
      {state.error && <FieldError>{state.error}</FieldError>}
    </form>
  );
}

// Sign out, then load the sign-in page afresh (see adminSignOut for why not a redirect).
export function SignOutButton({ className, children, label }: { className?: string; children: React.ReactNode; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      className={className}
      onClick={() =>
        start(async () => {
          await adminSignOut();
          window.location.replace("/login"); // a full load: see adminSignOut
        })
      }
    >
      {children}
    </button>
  );
}

"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { friendlyError } from "@/lib/db-errors";
import { listHref } from "@/lib/rankings";
import { spaceNameSchema } from "@/lib/validation";

export type StartSpaceState = { error?: string; name?: string };

// Start a food list (a Space). If a list with that name already exists, go there instead of failing.
export async function startSpace(_: StartSpaceState, formData: FormData): Promise<StartSpaceState> {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  const raw = String(formData.get("name") ?? "");
  const name = spaceNameSchema.safeParse(raw);
  if (!name.success) return { name: raw, error: name.error.issues[0].message };

  const { data, error } = await supabase.from("spaces").insert({ name: name.data }).select("name").single<{ name: string }>();
  if (error?.code === "23505") redirect(listHref(name.data));
  if (error) return { name: raw, error: friendlyError(error, "Couldn't start that list. Try again in a moment.") };
  redirect(listHref(data.name));
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getList, listHref } from "@/lib/rankings";
import { dishSlug } from "@/lib/dishes";
import { signupDetailsSchema, usernameSchema } from "@/lib/validation";

export type OnboardingState = {
  error?: { field: "username" | "about" | "region" | "form"; message: string };
  username?: string;
};

// Sign-up's last step: handle and name, about you (birthday, gender, food preference), home region.
export async function createProfile(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const { supabase, userId, profile } = await getCurrentUser();
  if (profile) redirect("/");

  const field = (name: string) => String(formData.get(name) ?? "");
  const rawUsername = field("username");
  const username = usernameSchema.safeParse(rawUsername);
  if (!username.success) {
    return { username: rawUsername, error: { field: "username", message: username.error.issues[0].message } };
  }
  const about = signupDetailsSchema.safeParse({
    display_name: field("display_name"),
    diet: field("diet"),
    date_of_birth: field("date_of_birth"),
    gender: field("gender"),
  });
  if (!about.success) {
    return { username: rawUsername, error: { field: "about", message: about.error.issues[0].message } };
  }
  const region = field("region");
  if (!region) {
    return { username: rawUsername, error: { field: "region", message: "Pick where home is." } };
  }

  const { display_name, diet, date_of_birth, gender } = about.data;
  const { error } = await supabase
    .from("profiles")
    .insert({ id: userId, username: username.data, home_region: region, display_name, diet });

  if (error?.code === "23505" && error.message.includes("username")) {
    return { username: rawUsername, error: { field: "username", message: `@${username.data} is taken. Try another.` } };
  }
  if (error?.code === "23503") {
    return { username: rawUsername, error: { field: "region", message: "That place isn't on our list yet." } };
  }
  // 23505 on the primary key means this account already finished onboarding (double submit).
  if (error && error.code !== "23505") {
    return { username: rawUsername, error: { field: "form", message: "Couldn't save that. Try again in a moment." } };
  }

  // Private details (owner-only table). The age was checked above; if this write fails, the profile still stands
  // and the birthday can be added from Edit profile, so don't block sign-up on it.
  await supabase.from("profile_private").upsert({ date_of_birth, gender }, { onConflict: "user_id" });
  revalidatePath("/", "layout"); // the phone nav in the root layout was rendered signed out (no profile yet)
  // First food they picked that is a real list: open its ranking.
  for (const food of formData.getAll("food").slice(0, 5).map(String)) {
    if (await getList(supabase, dishSlug(food))) redirect(listHref(food));
  }
  redirect("/");
}

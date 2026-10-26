"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";

export type ProfileFormState = { error?: string };

const PHOTO_PATH = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/;

// Save the profile (public details), the private details (birthday, gender), and the photo; then show the profile.
export async function updateProfile(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  const field = (name: string) => String(formData.get(name) ?? "");
  const parsed = profileSchema.safeParse({
    display_name: field("display_name"),
    bio: field("bio"),
    avatar: field("avatar"),
    diet: field("diet"),
    instagram: field("instagram"),
    date_of_birth: field("date_of_birth"),
    gender: field("gender"),
    home_region: field("home_region"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { date_of_birth, gender, ...details } = parsed.data;

  // The photo was uploaded from the browser into the user's own folder; only accept a path there.
  const avatar_path = field("avatar_path") || null;
  if (avatar_path && !(avatar_path.startsWith(`${userId}/`) && PHOTO_PATH.test(avatar_path))) {
    return { error: "That photo didn't upload properly. Try adding it again." };
  }

  const { error } = await supabase.from("profiles").update({ ...details, avatar_path }).eq("id", userId);
  // 23514 from the region trigger: changed in the last 30 days (the form says when, so this is a fallback).
  if (error?.code === "23514" && error.message.includes("home region")) return { error: "You changed your home region less than 30 days ago. Try again later." };
  if (error) return { error: "Couldn't save that just now. Try again in a moment." };

  // user_id fills itself from the session (only these two columns are writable).
  const { error: privateError } = await supabase.from("profile_private").upsert({ date_of_birth, gender }, { onConflict: "user_id" });
  if (privateError) return { error: "Saved your profile, but not your birthday and gender. Try again." };

  // Tidy up a replaced or removed photo. Best effort: a leftover file is harmless.
  if (profile.avatar_path && profile.avatar_path !== avatar_path) {
    await supabase.storage.from("avatars").remove([profile.avatar_path]);
  }

  revalidatePath("/", "layout"); // the phone nav shows your avatar and handle
  redirect(`/u/${profile.username}?done=profile`);
}

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { preferencesSchema, privacySchema } from "@/lib/validation";

export type DeleteAccountState = { error?: string };

// Delete your account for good. You confirm by typing your handle. The database removes the account and everything that
// hangs off it first; only then do the photo files go (Storage isn't part of the cascade). That order means a failed
// delete never leaves a live account with its pictures gone, and a failed file clean-up leaves only invisible files.
export async function deleteAccount(_: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const { supabase, userId, profile } = await getCurrentUser({ allowSuspended: true });
  if (!profile) redirect("/onboarding");
  const typed = String(formData.get("confirm") ?? "").trim().replace(/^@/, "").toLowerCase();
  if (typed !== profile.username) return { error: `Type ${profile.username} to confirm.` };

  // Their files, listed while the account still exists.
  // shortcut: up to 1000 files per bucket; page through them if anyone ever uploads more.
  const files = await Promise.all(
    ["rating-photos", "avatars"].map(async (bucket) => {
      const { data } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
      return { bucket, paths: (data ?? []).map((f) => `${userId}/${f.name}`) };
    }),
  );

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    if (error.message.includes("superadmin")) return { error: "The superadmin account runs the admin site and can't be deleted." };
    return { error: "Couldn't delete your account just now. Try again in a moment." };
  }
  for (const { bucket, paths } of files) if (paths.length) await supabase.storage.from(bucket).remove(paths);

  await supabase.auth.signOut();
  redirect("/?account=deleted");
}

export type PreferencesState = { error?: string; saved?: number };

// Which dishes to show and which feed opens first. Stored with your private details (owner-only).
export async function savePreferences(prev: PreferencesState, formData: FormData): Promise<PreferencesState> {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const parsed = preferencesSchema.safeParse({ show_diet: formData.get("show_diet"), feed_default: formData.get("feed_default") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  // user_id fills itself from the session (only these columns are writable).
  const { error } = await supabase.from("profile_private").upsert(parsed.data, { onConflict: "user_id" });
  if (error) return { error: "Couldn't save that just now. Try again in a moment." };
  refresh();
  return { saved: (prev.saved ?? 0) + 1 }; // a new number each time, so the form can say "Saved"
}

export type PrivacyState = { error?: string; saved?: number };

// Who can see your "Want to try" list and Diary. Stored on your profile; the database enforces Want to try.
export async function savePrivacy(prev: PrivacyState, formData: FormData): Promise<PrivacyState> {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const parsed = privacySchema.safeParse({
    saves_visibility: formData.get("saves_visibility"),
    diary_visibility: formData.get("diary_visibility"),
    followers_visibility: formData.get("followers_visibility"),
    following_visibility: formData.get("following_visibility"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", userId);
  if (error) return { error: "Couldn't save that just now. Try again in a moment." };
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

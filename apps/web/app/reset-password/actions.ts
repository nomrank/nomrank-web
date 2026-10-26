"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/lib/validation";

export type ResetState = { status: "idle" } | { status: "error"; message: string };

// Only reachable with the session the emailed recovery link created, which is re-checked here, not trusted.
export async function setPassword(_: ResetState, formData: FormData): Promise<ResetState> {
  const password = passwordSchema.safeParse(String(formData.get("password") ?? ""));
  if (!password.success) return { status: "error", message: password.error.issues[0].message };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { status: "error", message: "That link expired. Ask for a new one from the sign-in screen." };

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    if (error.code === "same_password") return { status: "error", message: "Pick a password you haven't used here before." };
    if (error.code === "weak_password") return { status: "error", message: "Pick a stronger password: at least 8 characters." };
    return { status: "error", message: "Couldn't save your password just now. Try again in a moment." };
  }
  redirect("/");
}

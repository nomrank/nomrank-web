"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { friendlyError } from "@/lib/db-errors";
import { reportSchema } from "@/lib/validation";

export type ReportState = { error?: string; sent?: boolean };

// Report a take, a comment, a dish or a list. Reporting the same thing again counts as done.
export async function sendReport(_: ReportState, formData: FormData): Promise<ReportState> {
  const { supabase, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const parsed = reportSchema.safeParse({
    target_type: formData.get("target_type"),
    target_id: formData.get("target_id"),
    reason: String(formData.get("reason") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.from("reports").insert(parsed.data);
  if (error && error.code !== "23505") return { error: friendlyError(error, "Couldn't send that just now. Try again in a moment.") };
  return { sent: true };
}

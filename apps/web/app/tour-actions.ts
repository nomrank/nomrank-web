"use server";

import { getCurrentUser } from "@/lib/auth";

// The first-time tour is done (watched or skipped): it won't come back on any device.
export async function finishTour() {
  const { supabase, userId } = await getCurrentUser();
  const { error } = await supabase.from("profiles").update({ tour_done_at: new Date().toISOString() }).eq("id", userId);
  if (error) throw error;
}

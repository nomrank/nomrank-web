"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

// Opening the notifications page marks everything as read (RLS limits this to your own).
export async function markAllRead() {
  const { supabase, userId } = await getCurrentUser();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  revalidatePath("/", "layout"); // the phone nav's Activity badge lives in the root layout
}

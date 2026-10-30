import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { City } from "./cities";

export type Profile = {
  username: string;
  avatar: string | null;
  avatar_path: string | null;
  home_region: string;
  city: City | null;
  tour_done_at: string | null;
  banned_at: string | null;
  regions: { name: string; demonym: string } | null;
};

// For public pages: the viewer may be signed out (userId null). Signed in without a profile → /onboarding.
export async function getViewer() {
  // Session checks read the clock (token expiry), so keep them out of prerendering.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub ?? null;
  if (!userId) return { supabase, userId, profile: null };

  const profile = await getProfile(supabase, userId);
  if (!profile) redirect("/onboarding");
  if (profile.banned_at) redirect("/suspended");
  return { supabase, userId, profile };
}

// For pages that need a session. Signed out → /login. The profile may be missing (onboarding).
// Suspended accounts go to /suspended, except where `allowSuspended` (deleting your account stays possible).
export async function getCurrentUser({ allowSuspended = false } = {}) {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");
  const profile = await getProfile(supabase, userId);
  if (profile?.banned_at && !allowSuspended) redirect("/suspended");
  return { supabase, userId, profile };
}

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username, avatar, avatar_path, home_region, city, tour_done_at, banned_at, regions(name, demonym)")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (error) throw error;
  return profile;
}

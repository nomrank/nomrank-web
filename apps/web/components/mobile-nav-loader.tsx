import { headers } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unreadCount } from "@/lib/notifications";
import { MobileNav } from "@/components/mobile-nav";

// Reads the host and session cookie, so the layout streams it in under <Suspense>. Unlike getViewer() it never
// redirects: the nav sits on every page, including sign-in and onboarding, where a redirect here would loop.
export async function MobileNavLoader() {
  await connection(); // session checks read the clock (token expiry), which can't happen while prerendering
  // Pre-launch the main domain rewrites "/" to the waitlist page (see proxy.ts), so the URL alone can't tell us.
  const host = (await headers()).get("host") ?? "";
  if (host.startsWith("admin.")) return null; // the admin site has its own header
  if (process.env.COMING_SOON === "1" && !host.startsWith("beta.")) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return <MobileNav viewer={null} unread={0} />;

  const { data: profile } = await supabase.from("profiles").select("username, avatar, avatar_path").eq("id", userId).maybeSingle();
  if (!profile) return <MobileNav viewer={null} unread={0} />;
  const unread = await unreadCount(supabase, userId);
  return <MobileNav viewer={{ handle: profile.username, avatar: profile.avatar, photo: profile.avatar_path }} unread={unread} />;
}

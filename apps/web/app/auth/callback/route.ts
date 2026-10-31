import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_NEXT_COOKIE, inviteNext, isAdminOrigin } from "@/lib/superadmin";

// Where someone lands after Google on the admin site. An admin goes to the dashboard. Someone holding an invitation goes
// back to it (the invitation itself checks their email). Anyone else is signed out: the admin site only opens its doors
// to admins and to the people they invite.
async function adminLanding(supabase: SupabaseClient) {
  const jar = await cookies();
  const next = inviteNext(jar.get(ADMIN_NEXT_COOKIE)?.value);
  jar.delete({ name: ADMIN_NEXT_COOKIE, path: "/auth" });
  const { data } = await supabase.rpc("admin_status");
  if (data?.admin) return "/";
  if (next) return next;
  await supabase.auth.signOut();
  return "/login?error=not-admin";
}

// Landing for Google sign-in and old magic links: swap the one-time code for a session cookie, then let "/" route onward.
export async function GET(request: NextRequest) {
  // On the admin site the redirect has to stay on that host (in development Next reports the request as plain localhost).
  const host = request.headers.get("host") ?? "";
  const hostOrigin = `${request.nextUrl.protocol}//${host}`;
  const admin = isAdminOrigin(hostOrigin);
  const go = (path: string) => NextResponse.redirect(new URL(path, admin ? hostOrigin : request.url));

  const code = request.nextUrl.searchParams.get("code");
  // Cancelled or refused at Google: say so, rather than blaming a link.
  if (request.nextUrl.searchParams.has("error")) return go("/login?error=google");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return go(admin ? await adminLanding(supabase) : "/");
  }
  return go("/login?error=link");
}

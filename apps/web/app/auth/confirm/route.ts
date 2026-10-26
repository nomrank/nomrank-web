import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Where the links in our emails land. The token travels in the link itself, so it works in any browser or device:
// the older /auth/callback code only worked in the browser that asked for it, which is what showed "link expired".
// The type alone picks the destination; nothing in the URL can redirect elsewhere.
const NEXT: Partial<Record<EmailOtpType, string>> = { email: "/", signup: "/", recovery: "/reset-password" };

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = type ? NEXT[type] : undefined;
  if (tokenHash && type && next) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}

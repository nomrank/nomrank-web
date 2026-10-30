import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing for Google sign-in and old magic links: swap the one-time code for a session cookie, then let "/" route onward.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  // Cancelled or refused at Google: say so, rather than blaming a link.
  if (request.nextUrl.searchParams.has("error")) return NextResponse.redirect(new URL("/login?error=google", request.url));
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}

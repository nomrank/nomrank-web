import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Everything is public to read except these, which need a session (writing is guarded by RLS regardless).
const PRIVATE_PATHS = ["/onboarding", "/rate", "/settings", "/admin", "/suspended", "/notifications"];

// `rewriteTo` serves another path at this URL (the admin site maps its paths onto /admin).
export async function updateSession(request: NextRequest, rewriteTo?: URL) {
  const pass = () => (rewriteTo ? NextResponse.rewrite(rewriteTo, { request }) : NextResponse.next({ request }));
  let response = pass();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = pass();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  // Nothing between createServerClient and getClaims: this refreshes the session cookie.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const isPrivate = PRIVATE_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  // Optimistic redirect only; pages and RLS do the real checks.
  if (!signedIn && isPrivate) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return redirectWithCookies(url, response);
  }
  if (signedIn && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

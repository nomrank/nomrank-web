import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Pre-launch: with COMING_SOON=1 (set on Vercel for Production only), the main domain shows the waitlist page and
// everything else stays closed, apart from these pages. Locally and on preview deployments the full app runs, and so
// does beta.nomrank.in (the friends beta), which is kept out of search results.
const OPEN_BEFORE_LAUNCH = ["/coming-soon", "/about", "/terms", "/privacy", "/credits", "/opengraph-image", "/icon", "/apple-icon", "/_vercel", "/sitemap.xml"]; // /_vercel: analytics script and beacons

// The admin site (admin.nomrank.in, locally admin.localhost:3000) is the /admin routes at the root of its own host.
// These pass through untouched: sign-in links, the session refresh, generated icons and Next's own files.
const ADMIN_PASSTHROUGH = ["/admin", "/auth", "/icon", "/apple-icon", "/_vercel", "/_next"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The Host header, not nextUrl.hostname: in dev Next reports "localhost" for admin.localhost too.
  const hostname = request.headers.get("host") ?? request.nextUrl.hostname;

  if (hostname.startsWith("admin.")) {
    const passthrough = ADMIN_PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const url = request.nextUrl.clone();
    if (!passthrough) url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
    const response = await updateSession(request, passthrough ? undefined : url);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  // Everywhere else the admin site doesn't exist.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return NextResponse.rewrite(new URL("/not-found-admin", request.url));

  const beta = hostname.startsWith("beta.");
  if (process.env.COMING_SOON === "1" && !beta) {
    if (pathname === "/") return NextResponse.rewrite(new URL("/coming-soon", request.url));
    if (OPEN_BEFORE_LAUNCH.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
    return NextResponse.redirect(new URL("/", request.url));
  }
  const response = await updateSession(request);
  if (beta) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|webmanifest)$).*)",
  ],
};

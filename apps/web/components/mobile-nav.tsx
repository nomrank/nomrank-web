"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BellIcon, HomeIcon, LogInIcon, PlusIcon, TrophyIcon } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { hidesMobileNav } from "@/lib/mobile-nav";
import { showTab } from "@/lib/home-tab";
import { cn } from "@/lib/utils";

type Viewer = { handle: string; avatar: string | null; photo: string | null };

// The phone's bottom bar (hidden from md up, where the header carries these). A spacer the same height keeps the
// last line of every page clear of it.
export function MobileNav({ viewer, unread }: { viewer: Viewer | null; unread: number }) {
  const pathname = usePathname();
  const onRankings = useSearchParams().get("tab") === "rankings";
  if (hidesMobileNav(pathname)) return null;

  const rankings = pathname.startsWith("/top") || (pathname === "/" && onRankings);
  // Already on Home: switch its tab in place (instant) instead of reloading the page from the server.
  const stayHome = (e: React.MouseEvent, v: "takes" | "rankings") => {
    if (pathname !== "/") return;
    e.preventDefault();
    showTab(v);
    window.scrollTo({ top: 0 });
  };
  const tab = (active: boolean) =>
    cn(
      "relative flex h-14 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold outline-none transition-colors focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
      active ? "text-foreground" : "text-faint active:text-foreground",
    );
  const dot = (active: boolean) =>
    active && <span aria-hidden className="absolute top-0 h-0.5 w-6 rounded-full bg-ketchup" />;

  return (
    <>
      <div aria-hidden className="h-14 shrink-0 md:hidden" />
      <nav
        aria-label="Main"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 grid border-t border-hairline bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden",
          viewer ? "grid-cols-5" : "grid-cols-3",
        )}
      >
        <Link href="/" onClick={(e) => stayHome(e, "takes")} aria-current={pathname === "/" && !onRankings ? "page" : undefined} className={tab(pathname === "/" && !onRankings)}>
          {dot(pathname === "/" && !onRankings)}
          <HomeIcon aria-hidden className="size-[22px]" />
          Home
        </Link>
        <Link href="/?tab=rankings" onClick={(e) => stayHome(e, "rankings")} aria-current={rankings ? "page" : undefined} className={tab(rankings)}>
          {dot(rankings)}
          <TrophyIcon aria-hidden className="size-[22px]" />
          Rankings
        </Link>
        {viewer ? (
          <>
            <Link href="/rate" aria-label="Rate a dish" className="group relative grid h-14 place-items-center outline-none">
              <span className="absolute -top-4 grid size-12 place-items-center rounded-full bg-ketchup text-studio shadow-[0_6px_18px_-6px_rgb(255_75_58/0.7)] ring-4 ring-paper transition-transform group-focus-visible:ring-ring active:scale-95">
                <PlusIcon aria-hidden className="size-6" strokeWidth={2.75} />
              </span>
            </Link>
            <Link
              href="/notifications"
              aria-label={unread ? `Activity, ${unread} new` : "Activity"}
              aria-current={pathname === "/notifications" ? "page" : undefined}
              className={tab(pathname === "/notifications")}
            >
              {dot(pathname === "/notifications")}
              <span className="relative">
                <BellIcon aria-hidden className="size-[22px]" />
                {unread > 0 && (
                  <span aria-hidden className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-ketchup px-1 text-[0.625rem] font-bold text-studio tabular-nums ring-2 ring-paper">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              Activity
            </Link>
            <Link href={`/u/${viewer.handle}`} aria-current={pathname === `/u/${viewer.handle}` ? "page" : undefined} className={tab(pathname === `/u/${viewer.handle}`)}>
              {dot(pathname === `/u/${viewer.handle}`)}
              <Avatar handle={viewer.handle} code={viewer.avatar} photo={viewer.photo} size={viewer.photo ? 26 : 24} />
              You
            </Link>
          </>
        ) : (
          <Link href="/login" className={tab(false)}>
            <LogInIcon aria-hidden className="size-[22px]" />
            Sign in
          </Link>
        )}
      </nav>
    </>
  );
}

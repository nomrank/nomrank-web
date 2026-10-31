import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { cn } from "@/lib/utils";

const LINK = "rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/?tab=rankings", label: "Rankings" },
      { href: "/battles", label: "Battles", fresh: true },
      { href: "/rate", label: "Rate a dish" },
      { href: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/about", label: "How Nomrank works" },
      { href: "/about#rankings", label: "How rankings work" },
      { href: "/about#guidelines", label: "Community guidelines" },
    ],
  },
];

// Before launch (COMING_SOON=1, see proxy.ts) only these pages are open, so the footer links to just them.
const PRELAUNCH_COLUMNS = [
  {
    title: "Nomrank",
    links: [
      { href: "/", label: "Join the waitlist" },
      { href: "/about", label: "How Nomrank works" },
      { href: "/about#rankings", label: "How rankings work" },
      { href: "/about#guidelines", label: "Community guidelines" },
    ],
  },
];

const LEGAL = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/credits", label: "Credits" },
];

// The end of every page: the brand, the links, the one disclaimer (scores are users' opinions; no restaurant ties) so
// pages don't each repeat it, and the name set huge and cut off by the bottom of the page.
export function SiteFooter({ prelaunch = process.env.COMING_SOON === "1", className }: { prelaunch?: boolean; className?: string }) {
  const columns = prelaunch ? PRELAUNCH_COLUMNS : COLUMNS;
  return (
    <footer className={cn("mt-10 w-full overflow-hidden border-t border-hairline md:mt-12", className)}>
      <div className="mx-auto w-full max-w-[76rem] px-5 pt-8 sm:px-8 lg:px-10 lg:pt-10">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div>
            <Wordmark />
            <p className="mt-3 text-sm text-muted-foreground">Rate the dish, not the place.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-16 gap-y-8 md:gap-x-20">
            {columns.map((c) => (
              <div key={c.title}>
                <h2 className="text-sm text-muted-foreground">{c.title}</h2>
                <ul className="mt-1.5 flex flex-col">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={`inline-flex min-h-9 items-center gap-2 font-medium text-foreground/90 ${LINK}`}>
                        {l.label}
                        {"fresh" in l && <span className="rounded-full bg-raised px-2 py-0.5 text-xs font-semibold text-mustard">New</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Nomrank. All rights reserved.</p>

          <nav aria-label="Legal" className="-my-2 flex gap-5">
            {LEGAL.map((l) => (
              <Link key={l.href} href={l.href} className={`inline-flex min-h-10 items-center ${LINK}`}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-3 max-w-[95ch] space-y-1 text-xs leading-relaxed text-faint">
          <p>
            {prelaunch
              ? "Nomrank opens soon."
              : "Scores, rankings and takes are the personal opinions of people on Nomrank. Nomrank isn't affiliated with, or paid by, any restaurant listed."}
          </p>
          <p>
            Nomrank and its original branding, design, website content, and proprietary materials are protected by applicable intellectual property laws. Unauthorised copying, reproduction, distribution, or commercial use without prior written permission is prohibited.
          </p>
        </div>
      </div>

      <div aria-hidden className="mt-6 h-[clamp(3.5rem,10vw,9rem)] select-none">
        <p className="text-center font-wordmark text-[24vw] leading-[0.82] font-extrabold tracking-[-0.045em] whitespace-nowrap text-foreground/[0.07]">nomrank</p>
      </div>
    </footer>
  );
}

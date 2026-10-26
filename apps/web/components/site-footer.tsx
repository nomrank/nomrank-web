import Link from "next/link";
import { BookOpenIcon, CameraIcon, FileTextIcon, HeartHandshakeIcon, MailIcon, ScaleIcon, SettingsIcon, ShieldIcon } from "lucide-react";
import { Wordmark } from "@/components/brand";

const LINKS = [
  { href: "/about", label: "How Nomrank works", icon: BookOpenIcon },
  { href: "/about#rankings", label: "How rankings work", icon: ScaleIcon },
  { href: "/about#guidelines", label: "Community guidelines", icon: HeartHandshakeIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/terms", label: "Terms of Service", icon: FileTextIcon },
  { href: "/privacy", label: "Privacy Policy", icon: ShieldIcon },
];

// Before launch (COMING_SOON=1, see proxy.ts) only these pages are open, so the footer links to just them.
const PRELAUNCH_LINKS = [
  { href: "/", label: "Join the waitlist", icon: MailIcon },
  { href: "/about", label: "How Nomrank works", icon: BookOpenIcon },
  { href: "/terms", label: "Terms of Service", icon: FileTextIcon },
  { href: "/privacy", label: "Privacy Policy", icon: ShieldIcon },
  { href: "/credits", label: "Credits", icon: CameraIcon },
];

// On every browsing page: the brand, the links that explain how things work, and the one disclaimer
// (scores are users' opinions; no restaurant ties) so pages don't each repeat it.
export function SiteFooter() {
  // Read on the server. The client-side homepage also renders this footer, but before launch the proxy never serves it.
  const prelaunch = process.env.COMING_SOON === "1";
  return (
    <footer className="mx-auto mt-6 w-full md:mt-16 max-w-6xl border-t border-hairline px-5 pt-8 lg:px-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Wordmark />
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">Rate the dish, not the place.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-1 sm:gap-x-12">
          {(prelaunch ? PRELAUNCH_LINKS : LINKS).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="-mx-1.5 inline-flex min-h-10 items-center gap-2 rounded-md px-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon aria-hidden className="size-4 shrink-0 text-faint" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-6 space-y-2 text-xs leading-relaxed text-faint">
        <p>
          {prelaunch
            ? "Nomrank opens soon."
            : "Scores, rankings and takes are the personal opinions of people on Nomrank. Nomrank isn't affiliated with, or paid by, any restaurant listed."}
        </p>
        <p>© 2026 Nomrank. All rights reserved.</p>
        <p>
          Nomrank and its original branding, design, website content, and proprietary materials are protected by applicable intellectual property laws. Unauthorised copying, reproduction, distribution, or commercial use without prior written permission is prohibited.
        </p>
      </div>
    </footer>
  );
}

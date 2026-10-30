import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";
import { HeroBand } from "./hero-band";
import { ScoreDemo } from "./score-demo";
import { TakeDemo } from "./take-demo";
import { FairRankDemo } from "./fair-rank-demo";
import { FeatureList } from "./feature-list";
import { Reveal } from "./reveal";
import { Wordmark } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Nomrank · Rate the dish, not the place",
  description: "Rate single dishes from 1 to 10. Opening in Bengaluru, Mumbai, Delhi and Hyderabad. Join the waitlist to hear when Nomrank opens.",
  // Served at "/" (the proxy rewrites it here before launch), so "/" is the one address search engines should index.
  alternates: { canonical: "/" },
};

// Tells search engines Nomrank is a brand with this name, site and logo.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.nomrank.in";
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "Nomrank", url: SITE, logo: `${SITE}/icon` },
    { "@type": "WebSite", name: "Nomrank", url: SITE, description: "Rate the dish, not the place." },
  ],
};

// One page width and one pair of margins for every section, so all the left edges line up.
const WRAP = "mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-10";
const H2 = "text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance";
const LINK = "transition-colors duration-150 underline-offset-4 hover:text-spotlight hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-mustard focus-visible:outline-none";

// The pre-launch landing page, shown on the main domain while COMING_SOON=1 (see proxy.ts). The product shows
// itself: each section is a working piece of the app (the rating meter, a take, the feature search).
export default function ComingSoonPage() {
  return (
    <main className="bg-studio text-spotlight">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <Reveal />

      <header className={`${WRAP} flex h-16 animate-[fade-in_600ms_var(--ease-out)_both] items-center justify-between pt-[env(safe-area-inset-top)] lg:h-20`}>
        <Wordmark href={null} className="text-[1.5rem]" />
        <Link href="/about" className={`text-[1rem] ${LINK}`}>
          How it works
        </Link>
      </header>

      {/* Hero: the promise, real plates curving past with their scores, then the signup. */}
      <section className="flex flex-col pb-14 lg:min-h-[calc(100svh-5rem)] lg:justify-center lg:pb-10">
        <div className={`${WRAP} flex flex-col items-center pt-6 text-center lg:pt-2`}>
          <h1 className="text-[clamp(2.75rem,6vw,5.25rem)] leading-[0.98] font-semibold tracking-[-0.04em]">
            <span className="mask-line">
              <span>Rate the dish,</span>
            </span>
            <span className="mask-line">
              <span style={{ animationDelay: "110ms" }}>not the place.</span>
            </span>
          </h1>
          <p className="hero-after mt-4 max-w-[44ch] text-[1.0625rem] leading-relaxed text-balance text-muted-foreground lg:text-[1.1875rem]">
            Score one plate at a time, settle it in Battles, and find what&apos;s worth ordering.
          </p>
        </div>
        <div className="hero-after my-4 lg:my-5">
          <HeroBand />
        </div>
        <div className={`${WRAP} hero-after flex flex-col items-center`}>
          <WaitlistForm id="waitlist-email" className="w-full max-w-[32rem]" />
          <p className="mt-4 text-center text-[0.875rem] text-muted-foreground">Opening soon in Bengaluru, Mumbai, Delhi and Hyderabad. Scores shown are samples.</p>
        </div>
      </section>

      {/* The real rating meter, to try. */}
      <section className={`${WRAP} grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-12 lg:gap-16 lg:py-24`}>
        <div className="lg:col-span-5">
          <h2 data-reveal className={H2}>
            Your score, your call.
          </h2>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-5 max-w-[40ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
            Drag the meter. Hit 9 and the dish earns its Must try badge.
          </p>
        </div>
        <div data-reveal style={{ "--i": 2 } as React.CSSProperties} className="max-w-[36rem] lg:col-span-7 lg:max-w-none">
          <ScoreDemo />
        </div>
      </section>

      <section className={`${WRAP} py-14 lg:pt-12 lg:pb-32`}>
        <TakeDemo />
      </section>

      <section className={`${WRAP} grid grid-cols-1 items-center gap-10 py-14 lg:grid-cols-12 lg:gap-16 lg:py-24`}>
        <div className="lg:col-span-5">
          <h2 data-reveal className={H2}>
            One 10 can&apos;t win.
          </h2>
          <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-5 max-w-[40ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
            A brand-new dish with a single perfect score shouldn&apos;t beat a favourite that hundreds agree on. Flip the switch and watch.
          </p>
        </div>
        <div data-reveal style={{ "--i": 2 } as React.CSSProperties} className="lg:col-span-7">
          <FairRankDemo />
        </div>
      </section>

      {/* Features as the app's own search list. */}
      <section className={`${WRAP} py-14 lg:py-32`}>
        <h2 data-reveal className={H2}>
          What you can do
        </h2>
        <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-5 mb-10 max-w-[42ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          Search the list, or tap a feature to see it.
        </p>
        <div data-reveal style={{ "--i": 2 } as React.CSSProperties}>
          <FeatureList />
        </div>
      </section>

      {/* Close: the signup already open, on the ketchup field. */}
      <section className="bg-ketchup text-studio">
        <div className={`${WRAP} grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-12 lg:gap-16 lg:py-32`}>
          <div className="lg:col-span-6">
            <h2 data-reveal className="text-[clamp(2.75rem,5.4vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.04em]">
              Save your spot.
            </h2>
            <p data-reveal style={{ "--i": 1 } as React.CSSProperties} className="mt-5 max-w-[40ch] text-[1.0625rem] leading-relaxed lg:text-[1.1875rem]">
              Leave your email. We&apos;ll confirm it now and write again the day we open.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div
              data-ui
              data-reveal
              style={{ "--i": 2 } as React.CSSProperties}
              className="w-full rounded-3xl bg-studio p-6 text-spotlight shadow-[0_24px_48px_-16px_rgb(23_17_28/0.55)] sm:p-8"
            >
              <p className="text-[1.5rem] font-semibold tracking-[-0.02em]">Join the waitlist</p>
              <WaitlistForm id="waitlist-email-close" className="mt-6" />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter prelaunch className="mt-0 border-t-0 md:mt-0" />
    </main>
  );
}

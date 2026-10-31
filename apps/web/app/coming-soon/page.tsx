import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "./waitlist-form";
import { HeroBand } from "./hero-band";
import { ScoreDemo } from "./score-demo";
import { TakeDemo } from "./take-demo";
import { FairRankDemo } from "./fair-rank-demo";
import { FeatureList } from "./feature-list";
import { Reveal } from "./reveal";
import { CityMarquee } from "./city-marquee";
import { Wordmark } from "@/components/brand";
import { cn } from "@/lib/utils";
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
const EYEBROW = "text-[0.8125rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase";
const TILE = "rounded-[2rem] border border-hairline bg-raised/50";
const STEPS = [
  { title: "Rate a dish", text: "Score the plate, not the restaurant. A 1 to 10, a short take, a photo if you have one." },
  { title: "Argue about it", text: "People agree, disagree or reply. Every take shows how many are with you." },
  { title: "Find what's worth eating", text: "Rankings for every food, by city. Tastes like home shows what its own region thinks." },
];
const LINK = "transition-colors duration-150 underline-offset-4 hover:text-foreground hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-mustard focus-visible:outline-none";

// The pre-launch landing page, shown on the main domain while COMING_SOON=1 (see proxy.ts). The product shows
// itself: each section is a working piece of the app (the rating meter, a take, the feature search).
export default function ComingSoonPage() {
  return (
    <main className="bg-background text-foreground">
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

      {/* How it works: three steps with big outlined numerals. */}
      <section className={`${WRAP} py-14 lg:py-24`}>
        <p data-reveal className={EYEBROW}>How it works</p>
        <ol className="mt-6 grid grid-cols-1 border-y border-hairline md:grid-cols-3 md:divide-x md:divide-hairline">
          {STEPS.map((st, i) => (
            <li key={st.title} data-reveal style={{ "--i": i } as React.CSSProperties} className="flex flex-col gap-3 border-b border-hairline py-8 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0">
              <span aria-hidden className="numeral text-[5.5rem] leading-[0.85] font-extrabold tracking-[-0.05em] select-none">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em]">{st.title}</h2>
              <p className="max-w-[34ch] leading-relaxed text-muted-foreground">{st.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Try it: the real pieces of the app, each in its own framed tile. */}
      <section className={`${WRAP} pb-14 lg:pb-24`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p data-reveal className={EYEBROW}>Try it</p>
            <h2 data-reveal style={{ "--i": 1 } as React.CSSProperties} className={`mt-3 ${H2}`}>
              Poke around. It&apos;s the real thing.
            </h2>
          </div>
          <p data-reveal style={{ "--i": 2 } as React.CSSProperties} className="max-w-[36ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
            Everything below works like the app will. Nothing you type is saved.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <Tile className="lg:col-span-7" tag="Score" title="Your score, your call." text="Drag the meter. Hit 9 and the dish earns its Must try badge.">
            <ScoreDemo />
          </Tile>
          <Tile className="lg:col-span-5" tag="Rank" title="One 10 can't win." text="A new dish with one perfect score shouldn't beat a favourite hundreds agree on. Flip the switch.">
            <FairRankDemo />
          </Tile>
          <div data-reveal className={`${TILE} p-5 sm:p-8 lg:col-span-12 lg:p-12`}>
            <TakeDemo />
          </div>
        </div>
      </section>

      {/* The launch cities and their landmarks, scrolling. */}
      <CityMarquee />

      {/* Features as the app's own search list. */}
      <section className={`${WRAP} py-14 lg:py-32`}>
        <p data-reveal className={EYEBROW}>The menu</p>
        <h2 data-reveal style={{ "--i": 1 } as React.CSSProperties} className={`mt-3 ${H2}`}>
          What you can do
        </h2>
        <p data-reveal style={{ "--i": 2 } as React.CSSProperties} className="mt-5 mb-10 max-w-[42ch] text-[1.0625rem] leading-relaxed text-muted-foreground">
          Search the list, or tap a feature to see it.
        </p>
        <div data-reveal style={{ "--i": 3 } as React.CSSProperties}>
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

// A framed tile of the "Try it" grid: a small tag, a title and a line, then the working piece under it.
function Tile({ tag, title, text, className, children }: { tag: string; title: string; text: string; className?: string; children: React.ReactNode }) {
  return (
    <div data-reveal className={cn(TILE, "flex flex-col gap-6 p-5 sm:p-8", className)}>
      <div>
        <p className="inline-flex rounded-full border border-hairline bg-paper px-3 py-1 text-[0.75rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">{tag}</p>
        <h3 className="mt-4 text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance">{title}</h3>
        <p className="mt-2 max-w-[40ch] leading-relaxed text-muted-foreground">{text}</p>
      </div>
      <div className="flex flex-1 flex-col *:flex-1">{children}</div>
    </div>
  );
}

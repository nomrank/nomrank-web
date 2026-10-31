import type { ReactNode } from "react";
import { CITIES } from "@/lib/cities";

// Each launch city with the landmark people know it by, drawn as a line icon in a 64-unit box.
const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 2.25, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const MARKS: Record<(typeof CITIES)[number], { landmark: string; icon: ReactNode }> = {
  Bengaluru: {
    landmark: "Vidhana Soudha",
    icon: (
      <>
        <path d="M6 56h52M10 56V40h44v16M10 40h44" />
        <path d="M24 40V28h16v12M20 28h24M26 28a6 6 0 0 1 12 0M32 22V12M32 12l5 2-5 2" />
        <path d="M16 56V46M24 56V46M40 56V46M48 56V46M32 56v-8" />
      </>
    ),
  },
  Mumbai: {
    landmark: "Gateway of India",
    icon: (
      <>
        <path d="M6 56h52M10 56V30h44v26M10 30h44" />
        <path d="M24 56V42a8 8 0 0 1 16 0v14" />
        <path d="M10 30v-6M18 30v-6M46 30v-6M54 30v-6M10 24h8M46 24h8" />
        <path d="M26 30v-6a6 6 0 0 1 12 0v6M32 18v-4" />
      </>
    ),
  },
  Delhi: {
    landmark: "India Gate",
    icon: (
      <>
        <path d="M6 56h52M14 56V16h36v40M10 16h44M18 12h28" />
        <path d="M24 56V38a8 8 0 0 1 16 0v18" />
        <path d="M14 24h36" />
      </>
    ),
  },
  Hyderabad: {
    landmark: "Charminar",
    icon: (
      <>
        <path d="M6 56h52M14 56V32h36v24M14 32h36" />
        <path d="M26 56V44a6 6 0 0 1 12 0v12" />
        <path d="M10 56V20M18 56V20M10 20h8M14 20v-6M46 56V20M54 56V20M46 20h8M50 20v-6" />
        <path d="M14 14a2 2 0 1 0 0 .01M50 14a2 2 0 1 0 0 .01" />
        <path d="M26 32v-8h12v8M32 24v-6" />
      </>
    ),
  },
};

function Stop({ city }: { city: (typeof CITIES)[number] }) {
  const m = MARKS[city];
  return (
    <li className="flex shrink-0 items-center gap-4 pr-12 sm:pr-20">
      <span aria-hidden className="grid size-16 place-items-center rounded-2xl border border-hairline bg-raised/60 text-mustard sm:size-20">
        <svg viewBox="0 0 64 64" className="size-10 sm:size-12" {...STROKE}>
          {m.icon}
        </svg>
      </span>
      <span className="flex flex-col">
        <span className="numeral text-[clamp(2rem,4vw,3.25rem)] leading-none font-extrabold tracking-[-0.04em]">{city}</span>
        <span className="mt-1.5 text-[0.75rem] font-semibold tracking-[0.12em] text-faint uppercase">{m.landmark} · opening soon</span>
      </span>
    </li>
  );
}

// A slow ticker of the launch cities and their landmarks. It loops by repeating the list (the copy is hidden from screen
// readers), and under reduced motion it stops and wraps instead.
export function CityMarquee() {
  return (
    <section aria-label="Launch cities" className="overflow-hidden border-y border-hairline py-8 lg:py-12">
      <div className="flex w-max motion-safe:animate-[marquee_24s_linear_infinite] motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-8 motion-reduce:px-5">
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 || undefined} className={`flex shrink-0 motion-reduce:flex-wrap motion-reduce:gap-y-8 ${copy === 1 ? "motion-reduce:hidden" : ""}`}>
            {CITIES.map((c) => (
              <Stop key={c} city={c} />
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

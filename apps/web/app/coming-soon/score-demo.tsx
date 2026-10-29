"use client";

import { useState } from "react";
import Image from "next/image";
import { Score } from "@/components/score";
import { ScoreMeter } from "@/components/score-meter";
import { Verdict } from "@/components/verdict";
import { verdict } from "@/lib/ratings";

// The hero's working fragment: the app's own rating screen in miniature. The meter is the real one from /rate;
// as it moves, the sticker on the photo re-colours and turns into the scalloped Must try badge at 9 and up.
export function ScoreDemo() {
  const [score, setScore] = useState(9);
  return (
    <div data-ui className="w-full overflow-hidden rounded-3xl bg-paper text-spotlight">
      <div className="relative">
        <div className="overflow-hidden">
          <Image
            src="/coming-soon/dum-biryani-plate.jpg"
            alt="A plate of chicken dum biryani"
            width={960}
            height={540}
            sizes="(min-width: 1024px) 34rem, 100vw"
            priority
            className="drift aspect-[16/9] w-full object-cover object-[center_60%]"
          />
        </div>
        {/* Keyed by the verdict, so crossing into "Must try" (or out of it) stamps the sticker again. */}
        <span key={verdict(score).tone} className="absolute right-6 -bottom-9 animate-[stamp_340ms_var(--ease-out)]">
          <Score score={score} size={92} />
        </span>
      </div>
      <div className="px-5 pt-5 pb-6 sm:px-7 sm:pb-7">
        <div className="pr-24">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[1.375rem] leading-tight font-semibold tracking-[-0.02em]">
            Chicken dum biryani <Verdict score={score} />
          </p>
          <p className="mt-1 text-[0.9375rem] text-muted-foreground">from Ammi&apos;s Biryani House</p>
        </div>
        <div className="mt-6">
          <ScoreMeter score={score} onChange={setScore} />
        </div>
      </div>
    </div>
  );
}

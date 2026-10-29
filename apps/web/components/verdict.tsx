import { verdict } from "@/lib/ratings";
import { cn } from "@/lib/utils";

const VERDICT_TONE = {
  must: "bg-mustard/15 text-mustard",
  again: "bg-raised text-mustard",
  clean: "bg-raised text-foreground",
  okay: "bg-raised text-muted-foreground",
  skip: "bg-raised text-ketchup",
  back: "bg-ketchup/15 text-ketchup",
};

// The score in words, from "Send it back" to "Must try".
export function Verdict({ score }: { score: number }) {
  const v = verdict(score);
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full px-2 text-[0.6875rem] font-semibold tracking-[0.04em] whitespace-nowrap uppercase",
        VERDICT_TONE[v.tone],
      )}
    >
      {v.label}
    </span>
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ARCH, MARK_VIEWBOX, SPARKLE } from "@/lib/logo";

// The mark: the arch with the spoon cut out, in the current text colour, and the mustard sparkle.
// `twinkle` makes the sparkle pulse (the loader); everything else holds still.
export function LogoMark({ size = 28, className, twinkle }: { size?: number; className?: string; twinkle?: boolean }) {
  return (
    <svg aria-hidden viewBox={MARK_VIEWBOX} width={size} height={size} className={cn("shrink-0 overflow-visible", className)}>
      <path d={ARCH} fill="currentColor" fillRule="evenodd" />
      <path d={SPARKLE} className={cn("fill-mustard", twinkle && "sparkle-twinkle")} />
    </svg>
  );
}

// The lockup: the mark and "nomrank" in Plus Jakarta Sans ExtraBold, as in the owner's logo.
export function Wordmark({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <span className={cn("inline-flex items-end gap-1.5 text-[1.375rem] leading-none", className)}>
      {/* The arch sits on the baseline of the letters, the sparkle above it. */}
      <LogoMark size={32} className="translate-y-[0.06em]" />
      <span className="font-wordmark font-extrabold tracking-[-0.035em]">nomrank</span>
    </span>
  );
  return href ? (
    <Link href={href} aria-label="nomrank home" className="-mx-1 rounded-sm px-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {mark}
    </Link>
  ) : (
    mark
  );
}

import Link from "next/link";
import { cn } from "@/lib/utils";
import { FACE, FOX, HAND, LEAF, MARK_VIEWBOX, SPARKLE } from "@/lib/logo";

// The mark: the fox with its OK hand and sparkle, in the brand's own colours (the text colour doesn't tint it).
// `animate` is the loader: the fox arrives and idles, the hand gives its OK now and then, the sparkle glints (see globals.css).
// With no `size`, it takes its size from `className` (the wordmark sizes it in em, so it scales with the text).
export function LogoMark({ size, className, animate }: { size?: number; className?: string; animate?: boolean }) {
  return (
    <svg aria-hidden viewBox={MARK_VIEWBOX} width={size} height={size} className={cn("shrink-0 overflow-visible", animate && "fox-mark", className)}>
      <g className={animate ? "fox-head" : undefined}>
        <path d={FOX} className="fill-ketchup" fillRule="evenodd" />
        <path d={FACE} className="fill-[var(--logo-face)]" fillRule="evenodd" />
        <path d={LEAF} className="fill-[var(--logo-face)]" fillRule="evenodd" />
      </g>
      <path d={HAND} className={cn("fill-ketchup", animate && "fox-hand")} fillRule="evenodd" />
      <path d={SPARKLE} className={cn("fill-mustard", animate && "sparkle-twinkle")} fillRule="evenodd" />
    </svg>
  );
}

// The lockup: the fox beside "nomrank" in Plus Jakarta Sans ExtraBold. The fox is taller than the word and centred on it.
export function Wordmark({ className, href = "/" }: { className?: string; href?: string | null }) {
  const mark = (
    <span className={cn("inline-flex items-center gap-[0.28em] text-[1.375rem] leading-none", className)}>
      <LogoMark className="size-[1.9em]" />
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

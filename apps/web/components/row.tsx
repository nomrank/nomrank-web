import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { DietMark, type DietKind } from "@/components/diet-mark";

// A tappable list row: an optional small label, title (plain text, or a pre-styled element), one line of
// detail, chevron. Dish rows pass `diet` to show the veg / egg / non-veg mark before the title.
export function Row({ href, label, title, meta, diet }: { href: string; label?: React.ReactNode; title: React.ReactNode; meta: React.ReactNode; diet?: DietKind }) {
  return (
    <Link
      href={href}
      className="-mx-2 flex min-h-16 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {diet && <DietMark diet={diet} className="mt-1 self-start" />}
      <span className="min-w-0 flex-1">
        {label && <span className="block text-xs font-semibold text-faint">{label}</span>}
        {typeof title === "string" ? <span className="block text-base font-bold wrap-anywhere">{title}</span> : title}
        <span className="mt-0.5 block text-sm wrap-anywhere text-muted-foreground">{meta}</span>
      </span>
      <ChevronRightIcon aria-hidden className="size-5 shrink-0 text-foreground" />
    </Link>
  );
}

export function dishCount(n: number) {
  return n === 1 ? "1 dish" : `${n} dishes`;
}

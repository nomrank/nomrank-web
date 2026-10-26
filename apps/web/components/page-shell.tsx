import { ViewTransition } from "react";
import { Wordmark } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  action?: React.ReactNode;
  /** Wide pages lay out their own desktop columns; narrow pages (forms) stay one readable column. */
  wide?: boolean;
};

// Shell for browsing screens: a full-width header (wordmark + optional action), then the page.
export function PageShell({ children, action, wide }: Props) {
  return (
    <main className="flex min-h-dvh w-full flex-col pt-[max(env(safe-area-inset-top),0.75rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-3 px-5 lg:h-16 lg:px-8">
        <Wordmark />
        {action}
      </header>
      {/* Content rises in on arrival; default="none" keeps it still during unrelated transitions (e.g. tab switches). */}
      <ViewTransition enter="rise" default="none">
        <div className={cn("mx-auto mt-3 flex w-full flex-1 flex-col px-5 lg:mt-6 lg:px-8", wide ? "max-w-6xl" : "max-w-xl")}>{children}</div>
      </ViewTransition>
      <SiteFooter />
    </main>
  );
}

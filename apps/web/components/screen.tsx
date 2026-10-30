import { Wordmark } from "@/components/brand";
import { cn } from "@/lib/utils";

type ScreenProps = {
  /** Sign-up step: 1 email, 2 inbox, 3 handle, 4 about you, 5 home. Each finished step lights a dot (three at most). */
  step: number;
  children: React.ReactNode;
};

// Sign-up screens: the wordmark, three dots that light up as you get through sign-up, then the content.
export function Screen({ step, children }: ScreenProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <header className="flex h-11 items-center justify-between">
        <Wordmark />
        <span aria-hidden className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn("size-2 rounded-full transition-colors duration-300", i < step - 1 ? "bg-ketchup" : "bg-raised")} />
          ))}
        </span>
      </header>
      <div className="mt-8 flex flex-1 flex-col md:mt-14">{children}</div>
    </main>
  );
}

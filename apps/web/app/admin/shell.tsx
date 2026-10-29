import Link from "next/link";
import { LogOutIcon, UserRoundCogIcon } from "lucide-react";
import { Wordmark } from "@/components/brand";
import { PasswordForm, SignOutButton } from "./forms";

// The admin site's frame: the wordmark with an Admin tag, your account and sign out. No app nav, no footer.
export function AdminShell({ children, signedIn = true }: { children: React.ReactNode; signedIn?: boolean }) {
  return (
    <main className="flex min-h-dvh w-full flex-col pt-[max(env(safe-area-inset-top),0.75rem)] pb-[calc(env(safe-area-inset-bottom)+2.5rem)]">
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-5 lg:px-8">
        <span className="flex items-center gap-2.5">
          <Wordmark />
          <span className="rounded-full bg-mustard/15 px-2 py-0.5 text-xs font-semibold text-mustard">Admin</span>
        </span>
        {signedIn && (
          <span className="flex items-center gap-1">
            <Link
              href="/account"
              aria-label="Your account"
              className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <UserRoundCogIcon aria-hidden className="size-5" />
            </Link>
            <SignOutButton
              label="Sign out"
              className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <LogOutIcon aria-hidden className="size-5" />
            </SignOutButton>
          </span>
        )}
      </header>
      <div className="mx-auto mt-4 flex w-full max-w-6xl flex-1 flex-col px-5 lg:mt-6 lg:px-8">{children}</div>
    </main>
  );
}

// The superadmin's first sign-in: nothing else works until the default password is replaced.
export function ChangeDefaultPassword() {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-5 lg:mt-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set your own password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This account started with a password everyone could guess. Until you change it, nothing here will work. Pick one only you know.
        </p>
      </div>
      <PasswordForm />
    </div>
  );
}

// Signed in, but not an admin.
export function NotAdmin() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
      <h1 className="text-xl font-bold">This account isn&apos;t an admin</h1>
      <p className="max-w-sm text-sm text-muted-foreground">Sign out and sign in with an admin account. An existing admin can make you one.</p>
      <SignOutButton className="mt-2 min-h-11 rounded-md bg-ketchup px-5 text-sm font-semibold text-studio hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        Sign out
      </SignOutButton>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DownloadIcon, LogOutIcon, PencilIcon, ShieldIcon, SlidersHorizontalIcon, UserRoundIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPreferences, type Visibility } from "@/lib/profiles";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { BackLink } from "@/components/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/app/actions";
import { DeleteAccount } from "./delete-account";
import { ThemeToggle } from "@/components/theme-toggle";
import { PreferencesForm } from "./preferences-form";
import { PrivacyForm } from "./privacy-form";

export const metadata: Metadata = { title: "Settings · Nomrank" };

export default function SettingsPage() {
  return (
    <PageShell wide>
      <Suspense fallback={<PageLoader />}>
        <Settings />
      </Suspense>
    </PageShell>
  );
}

async function Settings() {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const [{ data }, prefs, privacy] = await Promise.all([
    supabase.auth.getClaims(),
    getPreferences(supabase, userId),
    supabase
      .from("profiles")
      .select("saves_visibility, diary_visibility, followers_visibility, following_visibility")
      .eq("id", userId)
      .single<{ saves_visibility: Visibility; diary_visibility: Visibility; followers_visibility: Visibility; following_visibility: Visibility }>(),
  ]);
  if (privacy.error) throw privacy.error;
  const email = typeof data?.claims.email === "string" ? data.claims.email : null;

  return (
    <div className="pb-10">
      <BackLink href="/" />
      <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight">Settings</h1>

      {/* Desktop: preferences on the left; privacy, account and the danger zone on the right. */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
        <Card id="preferences" title="Preferences" icon={SlidersHorizontalIcon} lead="What Nomrank shows you.">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Theme</p>
              <p className="text-sm text-muted-foreground">Light, dark, or match your device.</p>
            </div>
            <ThemeToggle />
          </div>
          <PreferencesForm initial={prefs} />
        </Card>

        <div className="flex flex-col gap-5 lg:gap-6">
          <Card id="privacy" title="Privacy" icon={ShieldIcon} lead="What other people can see on your profile.">
            <PrivacyForm initial={privacy.data} />
          </Card>

          <Card id="account" title="Account" icon={UserRoundIcon}>
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-semibold text-foreground">@{profile.username}</span>
              {email && <span className="block wrap-anywhere">{email}</span>}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/settings/profile" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                <PencilIcon data-icon="inline-start" />
                Edit profile
              </Link>
              <a href="/settings/export" download className={buttonVariants({ variant: "secondary", size: "lg" })}>
                <DownloadIcon data-icon="inline-start" />
                Download my data
              </a>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="lg">
                  <LogOutIcon data-icon="inline-start" />
                  Sign out
                </Button>
              </form>
            </div>
            <p className="mt-3 text-xs text-faint">Your data downloads as one file: profile, ratings, takes, comments, votes and lists.</p>
          </Card>

          <section id="danger" aria-label="Danger zone">
            <DeleteAccount handle={profile.username} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Card({ id, title, icon: Icon, lead, children }: { id: string; title: string; icon: React.ElementType; lead?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 rounded-2xl border border-hairline bg-paper p-4 sm:p-5">
      <h2 id={`${id}-title`} className="flex items-center gap-2 font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-mustard/12 text-mustard">
          <Icon aria-hidden className="size-4" />
        </span>
        {title}
      </h2>
      {lead && <p className="mt-1.5 text-sm text-muted-foreground">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getAdminStatus } from "@/lib/admin";
import { PageLoader } from "@/components/loader";
import { AdminShell, NotAdmin } from "../shell";
import { NameForm, PasswordForm } from "../forms";

export const metadata: Metadata = { title: "Your account · Nomrank Admin", robots: { index: false } };

export default function AdminAccountPage() {
  return (
    <AdminShell>
      <Suspense fallback={<PageLoader />}>
        <Account />
      </Suspense>
    </AdminShell>
  );
}

async function Account() {
  const { supabase, userId, profile } = await getCurrentUser();
  const status = await getAdminStatus(supabase);
  if (!status.admin) return <NotAdmin />;
  const [{ data: me }, { data: user }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle<{ display_name: string | null }>(),
    supabase.auth.getUser(),
  ]);
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{status.default_password ? "Set your own password" : "Your account"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          @{profile?.username} · {user.user?.email}
        </p>
      </div>
      <section aria-labelledby="name-title" className="rounded-2xl border border-hairline bg-paper p-4 sm:p-5">
        <h2 id="name-title" className="font-semibold">
          Name
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Shown on your profile and in the admin log.</p>
        <NameForm name={me?.display_name ?? null} />
      </section>
      <section aria-labelledby="password-title" className="rounded-2xl border border-hairline bg-paper p-4 sm:p-5">
        <h2 id="password-title" className="font-semibold">
          Password
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">It changes for the Nomrank app too: it&apos;s the same account.</p>
        <PasswordForm />
      </section>
    </div>
  );
}

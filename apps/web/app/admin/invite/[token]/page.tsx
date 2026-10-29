import { Suspense } from "react";
import type { Metadata } from "next";
import { PageLoader } from "@/components/loader";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "../../shell";
import { AdminLogin } from "../../login/admin-login";
import { AcceptInvite } from "./accept-invite";

export const metadata: Metadata = { title: "Admin invitation · Nomrank", robots: { index: false } };

export default function InvitePage({ params }: PageProps<"/admin/invite/[token]">) {
  return (
    <AdminShell signedIn={false}>
      <Suspense fallback={<PageLoader />}>
        <Invite params={params} />
      </Suspense>
    </AdminShell>
  );
}

// Signed out: sign in first (it brings you straight back here). Signed in: accept with this account.
async function Invite({ params }: Pick<PageProps<"/admin/invite/[token]">, "params">) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return <AdminLogin next={`/invite/${token}`} heading="Sign in to accept" />;
  return <AcceptInvite token={token} email={data.user.email ?? ""} />;
}

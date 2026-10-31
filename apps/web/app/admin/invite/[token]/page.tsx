import { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import type { Metadata } from "next";
import { PageLoader } from "@/components/loader";
import { createClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/admin";
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

// Signed out: sign in first (it brings you straight back here). Signed in: accept with this account. Admins are people
// who already have a Nomrank account, so someone without one is sent to the app to make it first.
async function Invite({ params }: Pick<PageProps<"/admin/invite/[token]">, "params">) {
  const { token } = await params;
  await connection(); // the session check reads the clock, so this part renders per request, not at build
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const app = appOrigin((await headers()).get("host"));
  const link = "font-semibold text-foreground underline-offset-4 hover:underline";
  if (!data.user)
    return (
      <>
        <AdminLogin next={`/invite/${token}`} heading="Sign in to accept" />
        <p className="mx-auto mt-5 max-w-sm text-center text-sm text-muted-foreground">
          No Nomrank account for this email yet?{" "}
          <a href={`${app}/login`} className={link}>
            Create one
          </a>
          , finish setting it up, then open this link again.
        </p>
      </>
    );
  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  if (!profile)
    return (
      <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3 lg:mt-16">
        <h1 className="text-2xl font-bold tracking-tight">One step first</h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold wrap-anywhere text-foreground">{data.user.email}</span> hasn&apos;t finished setting up its Nomrank account.{" "}
          <a href={`${app}/onboarding`} className={link}>
            Finish setup
          </a>
          , then open this link again.
        </p>
      </div>
    );
  return <AcceptInvite token={token} email={data.user.email ?? ""} />;
}

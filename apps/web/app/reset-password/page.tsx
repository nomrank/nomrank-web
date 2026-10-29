import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Screen } from "@/components/screen";
import { PageLoader } from "@/components/loader";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "New password · Nomrank", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <Screen step={1}>
      <Suspense fallback={<PageLoader />}>
        <ResetGate />
      </Suspense>
    </Screen>
  );
}

// Reads the session cookie, so it streams in on its own. Without the recovery link's session there is nothing to reset.
async function ResetGate() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=link");
  return <ResetForm />;
}

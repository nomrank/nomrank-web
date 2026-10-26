import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Screen } from "@/components/screen";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "New password · Nomrank", robots: { index: false } };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=link");
  return (
    <Screen step={1}>
      <ResetForm />
    </Screen>
  );
}

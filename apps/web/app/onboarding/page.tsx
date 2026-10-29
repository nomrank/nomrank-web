import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Screen } from "@/components/screen";
import { PageLoader } from "@/components/loader";
import { OnboardingForm, type Region } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up · Nomrank" };

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Screen step={3}><PageLoader /></Screen>}>
      <Onboarding />
    </Suspense>
  );
}

async function Onboarding() {
  const { supabase, profile } = await getCurrentUser();
  if (profile) redirect("/");

  const { data: regions, error } = await supabase
    .from("regions")
    .select("slug, name")
    .order("name")
    .returns<Region[]>();
  if (error) throw error;

  return <OnboardingForm regions={regions} />;
}

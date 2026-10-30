import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Screen } from "@/components/screen";
import { PageLoader } from "@/components/loader";
import { getLists } from "@/lib/rankings";
import { OnboardingForm, type Region } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up · Nomrank" };

export default function OnboardingPage() {
  return (
    <Suspense fallback={<Screen step={4}><PageLoader /></Screen>}>
      <Onboarding />
    </Suspense>
  );
}

async function Onboarding() {
  const { supabase, profile } = await getCurrentUser();
  if (profile) redirect("/");

  const { data: regions, error } = await supabase
    .from("regions")
    .select("slug, name, kind")
    .order("name")
    .returns<Region[]>();
  if (error) throw error;

  const foods = (await getLists(supabase)).map((l) => l.name);
  // Google hands over the person's name; fill it in (they can change it). Email sign-ups have none.
  const { data: auth } = await supabase.auth.getUser();
  const meta = auth.user?.user_metadata;
  const name = String(meta?.full_name ?? meta?.name ?? "").trim().slice(0, 40);
  return <OnboardingForm regions={regions} foods={foods} name={name} />;
}

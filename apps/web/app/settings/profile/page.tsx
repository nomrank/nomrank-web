import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPrivateDetails, getProfileByHandle } from "@/lib/profiles";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { BackLink } from "@/components/back-link";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Edit profile · Nomrank" };

export default function EditProfilePage() {
  return (
    <PageShell wide>
      <Suspense fallback={<PageLoader />}>
        <EditProfile />
      </Suspense>
    </PageShell>
  );
}

async function EditProfile() {
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");
  const [me, secret, regions, home] = await Promise.all([
    getProfileByHandle(supabase, profile.username),
    getPrivateDetails(supabase, userId),
    supabase.from("regions").select("slug, name, kind").order("name").returns<{ slug: string; name: string; kind: "state" | "ut" }[]>(),
    supabase.from("profiles").select("home_region_changed_at").eq("id", userId).single<{ home_region_changed_at: string | null }>(),
  ]);
  if (!me) redirect("/onboarding");
  if (regions.error) throw regions.error;
  if (home.error) throw home.error;
  // The home region can change once every 30 days (enforced by the database); say when it unlocks.
  const changed = home.data.home_region_changed_at;
  const unlocks = changed ? new Date(new Date(changed).getTime() + 30 * 86_400_000) : null;
  const regionLockedUntil = unlocks && unlocks > new Date() ? unlocks.toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" }) : null;

  return (
    <>
      <BackLink href={`/u/${profile.username}`} />
      <h1 className="mt-2 mb-6 text-2xl leading-tight font-bold tracking-tight">Edit profile</h1>
      <ProfileForm
        userId={userId}
        handle={me.username}
        regions={regions.data}
        regionLockedUntil={regionLockedUntil}
        initial={{
          display_name: me.display_name ?? "",
          bio: me.bio ?? "",
          avatar: me.avatar,
          avatar_path: me.avatar_path,
          diet: me.diet ?? "",
          instagram: me.instagram ?? "",
          date_of_birth: secret?.date_of_birth ?? "",
          gender: secret?.gender ?? "",
          home_region: profile.home_region,
        }}
      />
    </>
  );
}

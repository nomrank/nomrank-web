import { Suspense } from "react";
import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import { getCity } from "@/lib/city";
import { getBattles } from "@/lib/battles";
import { Wordmark } from "@/components/brand";
import { CityPicker } from "@/components/city-picker";
import { PageLoader } from "@/components/loader";
import { BattleFeed } from "./battle-feed";

export const metadata: Metadata = {
  title: "Battles · Nomrank",
  description: "Two dishes, one winner. Tap the one you'd order.",
};

// A full-screen feed: the header stays, the battles scroll and snap one at a time. On a phone it stops above the
// bottom bar (3.5rem plus the home-indicator gap), so nothing sits underneath it.
export default function BattlesPage({ searchParams }: PageProps<"/battles">) {
  return (
    <main className="flex h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] w-full flex-col pt-[max(env(safe-area-inset-top),0.75rem)] md:h-dvh">
      <Suspense
        fallback={
          <>
            <Header city={null} />
            <PageLoader />
          </>
        }
      >
        <Feed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Header({ city }: { city: Awaited<ReturnType<typeof getCity>> }) {
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-5 pb-3 lg:px-8">
      <div className="flex h-10 items-center justify-between">
        <Wordmark />
      </div>
      <CityPicker city={city} />
    </header>
  );
}

async function Feed({ searchParams }: Pick<PageProps<"/battles">, "searchParams">) {
  const { b } = await searchParams;
  const { supabase, userId } = await getViewer();
  const city = await getCity();
  const battles = await getBattles(supabase, userId, city);
  return (
    <>
      <Header city={city} />
      <div className="min-h-0 flex-1">
        <BattleFeed battles={battles} signedIn={userId !== null} city={city} focus={typeof b === "string" ? b : null} />
      </div>
    </>
  );
}

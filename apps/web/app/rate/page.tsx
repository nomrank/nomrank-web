import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDishById, getRestaurants } from "@/lib/restaurants";
import { getDishRatings } from "@/lib/ratings";
import { PageShell } from "@/components/page-shell";
import { PageLoader } from "@/components/loader";
import { BackLink } from "@/components/back-link";
import { DietMark } from "@/components/diet-mark";
import { dishHref } from "@/lib/dishes";
import { DishPicker } from "./dish-picker";
import { filterMenus } from "@/lib/diet";
import { getPreferences } from "@/lib/profiles";
import { RateForm } from "./rate-form";
import { DishGlance } from "./dish-glance";

export const metadata: Metadata = { title: "Rate · Nomrank" };

export default function RatePage({ searchParams }: PageProps<"/rate">) {
  return (
    <PageShell wide>
      <Suspense fallback={<PageLoader />}>
        <Rate searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function Rate({ searchParams }: Pick<PageProps<"/rate">, "searchParams">) {
  const dishId = (await searchParams).dish;
  const { supabase, userId, profile } = await getCurrentUser();
  if (!profile) redirect("/onboarding");

  if (typeof dishId !== "string") {
    return (
      <div className="mx-auto w-full max-w-xl lg:max-w-none">
        <BackLink href="/" />
        <h1 className="mt-2 mb-6 text-2xl leading-tight font-bold tracking-tight">What did you eat?</h1>
        <DishPicker restaurants={filterMenus(await getRestaurants(supabase), (await getPreferences(supabase, userId)).show_diet)} />
      </div>
    );
  }

  const dish = await getDishById(supabase, dishId);
  if (!dish) notFound();
  const { data: mine } = await supabase
    .from("ratings")
    .select("score, take, photos:rating_photos(path, position)")
    .eq("dish_id", dish.id)
    .eq("user_id", userId)
    .maybeSingle<{ score: number; take: string | null; photos: { path: string; position: number }[] }>();

  const others = (await getDishRatings(supabase, dish.id)).filter((r) => r.author.username !== profile.username);

  return (
    // Desktop: the form on the left, what others said about the dish pinned on the right.
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-14 xl:gap-20">
      <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
        <RateForm
          intro={
            <>
              <BackLink href={dishHref(dish.restaurant.slug, dish.name)} />
              <h1 className="mt-2 text-2xl leading-snug font-bold tracking-tight wrap-anywhere">How was the {dish.name}?</h1>
              <p className="mt-1 mb-7 text-muted-foreground">
                <DietMark diet={dish.diet} className="mr-1.5 align-[-0.1em]" />
                at {dish.restaurant.name}, {dish.restaurant.area}
                {mine && " · you've rated this before, saving updates it"}
              </p>
            </>
          }
          dish={dish}
          userId={userId}
          existing={mine && { score: mine.score, take: mine.take, photos: mine.photos.sort((a, b) => a.position - b.position).map((p) => p.path) }}
        />
      </div>
      <DishGlance dish={dish.name} ratings={others} />
    </div>
  );
}

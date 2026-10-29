"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { asCity, CITY_COOKIE } from "@/lib/cities";

// Remember which city someone browses, for a year, and re-render the page for it. Anything that isn't a launch city
// clears it (all cities).
export async function setCity(value: string | null) {
  const city = asCity(value);
  const jar = await cookies();
  if (city) jar.set(CITY_COOKIE, city, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  else jar.delete(CITY_COOKIE);
  refresh();
}

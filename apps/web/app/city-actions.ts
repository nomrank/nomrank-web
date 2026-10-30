"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { getViewer } from "@/lib/auth";
import { asCity, CITY_ASKED_COOKIE, CITY_COOKIE } from "@/lib/cities";

const YEAR = 60 * 60 * 24 * 365;

// Remember someone's city: in a cookie (works signed out) and on their profile (follows them to other devices).
export async function setCity(value: string) {
  const city = asCity(value);
  if (!city) return;
  (await cookies()).set(CITY_COOKIE, city, { path: "/", maxAge: YEAR, sameSite: "lax" });
  const { supabase, userId } = await getViewer();
  // If this write fails the cookie still covers this device, and they get asked again on the next one.
  if (userId) await supabase.from("profiles").update({ city }).eq("id", userId);
  refresh();
}

// "Not now" on the city question: don't ask again on this device.
export async function skipCity() {
  (await cookies()).set(CITY_ASKED_COOKIE, "1", { path: "/", maxAge: YEAR, sameSite: "lax" });
}

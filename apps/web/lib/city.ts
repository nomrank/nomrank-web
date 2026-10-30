import { cookies } from "next/headers";
import { asCity, CITY_ASKED_COOKIE, CITY_COOKIE, type City } from "./cities";

type HasCity = { city: City | null } | null;

// The viewer's city: from their profile when signed in, else this browser's cookie; null if they haven't picked.
// Server only (reads the request's cookie).
export async function getCity(profile: HasCity = null) {
  return profile?.city ?? asCity((await cookies()).get(CITY_COOKIE)?.value);
}

// Whether to ask where they are. Members are asked until it's on their profile, even with an older cookie.
export async function shouldAskCity(profile: HasCity, city: City | null) {
  if (profile ? profile.city : city) return false;
  return !(await cookies()).has(CITY_ASKED_COOKIE);
}

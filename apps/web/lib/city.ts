import { cookies } from "next/headers";
import { asCity, CITY_COOKIE } from "./cities";

// The city the viewer is browsing, or null for all cities. Server only (reads the request's cookie).
export async function getCity() {
  return asCity((await cookies()).get(CITY_COOKIE)?.value);
}

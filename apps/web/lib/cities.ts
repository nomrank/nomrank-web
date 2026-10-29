// The launch cities. Mirrors the restaurants_city_launch check in the database.
export const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"] as const;
export type City = (typeof CITIES)[number];

// The city someone browses is remembered in this cookie (no cookie: all cities), so it works signed out too.
export const CITY_COOKIE = "city";

export const asCity = (value: unknown): City | null => ((CITIES as readonly unknown[]).includes(value) ? (value as City) : null);

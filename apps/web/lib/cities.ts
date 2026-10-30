// The launch cities. Mirrors the restaurants_city_launch check in the database.
export const CITIES = ["Bengaluru", "Mumbai", "Delhi", "Hyderabad"] as const;
export type City = (typeof CITIES)[number];

// A member's city lives on their profile; this cookie covers signed-out visitors (no city: all cities).
export const CITY_COOKIE = "city";
// Set when someone answers "Not now", so the question isn't asked again on this device.
export const CITY_ASKED_COOKIE = "city_asked";

export const asCity = (value: unknown): City | null => ((CITIES as readonly unknown[]).includes(value) ? (value as City) : null);

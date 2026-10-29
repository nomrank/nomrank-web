// What a profile says about someone's taste, worked out from their ratings: the unlock threshold,
// facts ("Regular at CTR"), badges, and taste match between two people.
import type { Review } from "./ratings";
import { isVegetarian } from "./diet";

// Ratings needed before the taste read (palate, average, score spread) shows.
export const UNLOCK_AT = 5;

type Rated = Pick<Review, "score" | "take" | "created_at" | "photos" | "dish">;

const dishOf = (r: Rated) => `${r.dish.restaurant.slug}/${r.dish.name.toLowerCase()}`;

// Dish families we can spot from the name. Order matters: "Masala Dosa" is a dosa, "Ghee Rice" is rice.
const FAMILIES = ["Dosa", "Idli", "Biryani", "Vada", "Coffee", "Burger", "Meals", "Bath", "Bajji", "Kebab", "Rice"];
export const familyOf = (name: string) => FAMILIES.find((f) => new RegExp(`\\b${f}\\b`, "i").test(name));

function mostCommon<T>(items: T[]) {
  const counts = new Map<T, number>();
  for (const x of items) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best: { value: T; count: number } | undefined;
  for (const [value, count] of counts) if (!best || count > best.count) best = { value, count };
  return best;
}

export type Facts = {
  regularAt?: { slug: string; name: string; count: number };
  diet?: "Mostly veg" | "Mostly non-veg" | "Eats both";
  signature?: string;
};

export function profileFacts(ratings: Rated[]): Facts {
  const facts: Facts = {};
  const place = mostCommon(ratings.map((r) => r.dish.restaurant.slug));
  if (place && place.count >= 3) {
    const r = ratings.find((x) => x.dish.restaurant.slug === place.value)!;
    facts.regularAt = { slug: place.value, name: r.dish.restaurant.name, count: place.count };
  }
  if (ratings.length >= UNLOCK_AT) {
    const veg = ratings.filter((r) => isVegetarian(r.dish.diet)).length / ratings.length;
    facts.diet = veg >= 0.8 ? "Mostly veg" : veg <= 0.2 ? "Mostly non-veg" : "Eats both";
  }
  const family = mostCommon(ratings.map((r) => familyOf(r.dish.name)).filter((f): f is string => Boolean(f)));
  if (family && family.count >= 2) facts.signature = family.value;
  return facts;
}

export type Badge = { id: string; label: string; detail: string };

const hourInIndia = (iso: string) => Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date(iso)));

// Milestones earned from ratings and trust. Only earned ones are returned, in a stable order.
export function badges(ratings: Rated[], trust: number): Badge[] {
  const places = new Set(ratings.map((r) => r.dish.restaurant.slug)).size;
  const family = (f: string) => ratings.filter((r) => familyOf(r.dish.name) === f).length;
  const veg = ratings.filter((r) => isVegetarian(r.dish.diet)).length;
  const lateNight = ratings.filter((r) => {
    const h = hourInIndia(r.created_at);
    return h >= 23 || h < 4;
  }).length;
  const all: [boolean, Badge][] = [
    [ratings.some((r) => r.take), { id: "first-take", label: "First take", detail: "Wrote a take" }],
    [ratings.length >= 10, { id: "ten-dishes", label: "10 dishes", detail: "Rated 10 dishes" }],
    [places >= 5, { id: "explorer", label: "Explorer", detail: "Rated dishes at 5 places" }],
    [trust >= 25, { id: "trusted", label: "Trusted", detail: "25 trust from agrees and likes" }],
    [family("Dosa") >= 5, { id: "dosa-devotee", label: "Dosa devotee", detail: "Rated 5 dosas" }],
    [family("Biryani") >= 5, { id: "biryani-buff", label: "Biryani buff", detail: "Rated 5 biryanis" }],
    [veg >= 3 && ratings.length - veg >= 3, { id: "all-rounder", label: "All-rounder", detail: "3 veg and 3 non-veg dishes" }],
    [lateNight >= 3, { id: "night-owl", label: "Night owl", detail: "3 ratings after 11pm" }],
    [ratings.filter((r) => r.photos.length).length >= 5, { id: "shutterbug", label: "Shutterbug", detail: "Photos on 5 ratings" }],
  ];
  return all.filter(([earned]) => earned).map(([, b]) => b);
}

export type TasteMatch = {
  common: number;
  percent: number | null; // null until there are 3 dishes in common
  split?: { dish: string; place: string; mine: number; theirs: number }; // the dish you two disagree on most
};

// How close two people's scores are on the dishes they've both rated: 100% means identical scores,
// 0% means as far apart as 0.5 and 10 every time.
export function tasteMatch(mine: Rated[], theirs: Rated[]): TasteMatch {
  const myScores = new Map(mine.map((r) => [dishOf(r), r.score]));
  const pairs = theirs.flatMap((r) => (myScores.has(dishOf(r)) ? [{ r, mine: myScores.get(dishOf(r))!, theirs: r.score }] : []));
  if (pairs.length < 3) return { common: pairs.length, percent: null };
  const meanGap = pairs.reduce((sum, p) => sum + Math.abs(p.mine - p.theirs), 0) / pairs.length;
  const widest = pairs.reduce((a, b) => (Math.abs(b.mine - b.theirs) > Math.abs(a.mine - a.theirs) ? b : a));
  return {
    common: pairs.length,
    percent: Math.round(100 * (1 - meanGap / 9.5)),
    split:
      widest.mine === widest.theirs
        ? undefined
        : { dish: widest.r.dish.name, place: widest.r.dish.restaurant.name, mine: widest.mine, theirs: widest.theirs },
  };
}

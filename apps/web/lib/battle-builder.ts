import type { DishDiet } from "./diet";

// One dish an admin can put in a battle, with what they need to tell two similar ones apart.
export type BattleDish = { id: string; name: string; place: string; area: string; city: string; diet: DishDiet };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// The dishes that fit what was typed: every word must appear in the dish's name, place, area or city, so "paradise biryani
// hyd" finds Paradise's biryani. Names that start with the first word come first. `skip` leaves out the other side's pick.
export function matchDishes(dishes: BattleDish[], query: string, skip: string | null = null, limit = 6) {
  const words = norm(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  const hits = dishes.filter((d) => {
    if (d.id === skip) return false;
    const hay = norm(`${d.name} ${d.place} ${d.area} ${d.city}`);
    return words.every((w) => hay.includes(w));
  });
  const first = words[0];
  const rank = (d: BattleDish) => (norm(d.name).startsWith(first) ? 0 : norm(d.place).startsWith(first) ? 1 : 2);
  return hits.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name)).slice(0, limit);
}

// The default title for a pair, kept inside the 80 characters the database allows.
export function suggestTitle(a: BattleDish | null, b: BattleDish | null) {
  if (!a || !b) return "";
  const title = a.name.toLowerCase() === b.name.toLowerCase() ? `${a.place} vs ${b.place}: ${a.name}` : `${a.name} vs ${b.name}`;
  return title.length <= 80 ? title : `${title.slice(0, 79)}…`;
}

// Where the battle shows: one city when both dishes are there, otherwise everywhere (a city war). Matches the server.
export const battleCity = (a: BattleDish | null, b: BattleDish | null) => (a && b ? (a.city === b.city ? a.city : null) : undefined);

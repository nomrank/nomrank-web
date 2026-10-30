import type { SupabaseClient } from "@supabase/supabase-js";
import type { DishDiet } from "./diet";
import type { City } from "./cities";

export type BattleSide = {
  id: string;
  name: string;
  diet: DishDiet;
  list: string | null; // the food list it belongs to ("Biryani"), for the icon
  place: string;
  area: string;
  city: string;
  avg: number | null;
  count: number;
};

export type Battle = { id: string; tag: string; city: City | null; a: BattleSide; b: BattleSide; votes: { a: number; b: number }; mine: "a" | "b" | null };

type DishRow = {
  id: string;
  name: string;
  diet: DishDiet;
  avg_score: number | null;
  rating_count: number;
  space: { name: string } | null;
  restaurant: { name: string; area: string; city: string };
};

const DISH = "id, name, diet, avg_score, rating_count, space:spaces(name), restaurant:restaurants(name, area, city)";

const side = (d: DishRow): BattleSide => ({
  id: d.id,
  name: d.name,
  diet: d.diet,
  list: d.space?.name ?? null,
  place: d.restaurant.name,
  area: d.restaurant.area,
  city: d.restaurant.city,
  avg: d.avg_score === null ? null : Number(d.avg_score),
  count: d.rating_count,
});

// Battles for a city (and the city wars, which show everywhere), unvoted ones first so the feed starts with a fight
// you haven't picked a side in. `city` null means every city.
export async function getBattles(supabase: SupabaseClient, userId: string | null, city: City | null): Promise<Battle[]> {
  let q = supabase
    .from("battles")
    .select(`id, tag, city, created_at, a:dishes!battles_dish_a_fkey(${DISH}), b:dishes!battles_dish_b_fkey(${DISH})`)
    .order("created_at");
  if (city) q = q.or(`city.eq.${city},city.is.null`);
  const { data, error } = await q.returns<{ id: string; tag: string; city: City | null; a: DishRow; b: DishRow }[]>();
  if (error) throw error;
  if (!data.length) return [];

  const ids = data.map((b) => b.id);
  const [tally, mine] = await Promise.all([
    supabase.from("battle_tally").select("battle_id, a, b").in("battle_id", ids),
    userId ? supabase.from("battle_votes").select("battle_id, side").eq("user_id", userId).in("battle_id", ids) : Promise.resolve({ data: [], error: null }),
  ]);
  if (tally.error) throw tally.error;
  if (mine.error) throw mine.error;
  const counts = new Map((tally.data ?? []).map((t) => [t.battle_id as string, { a: Number(t.a), b: Number(t.b) }]));
  const picks = new Map((mine.data ?? []).map((v) => [v.battle_id as string, v.side as "a" | "b"]));

  const battles = data.map((b) => ({
    id: b.id,
    tag: b.tag,
    city: b.city,
    a: side(b.a),
    b: side(b.b),
    votes: counts.get(b.id) ?? { a: 0, b: 0 },
    mine: picks.get(b.id) ?? null,
  }));
  return [...battles.filter((b) => !b.mine), ...battles.filter((b) => b.mine)];
}

// The share of votes for each side, in whole percents that add to 100 (50/50 with no votes).
export function split(votes: { a: number; b: number }) {
  const n = votes.a + votes.b;
  if (!n) return { a: 50, b: 50, n };
  const a = Math.round((votes.a / n) * 100);
  return { a, b: 100 - a, n };
}

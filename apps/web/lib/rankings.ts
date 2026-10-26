import type { SupabaseClient } from "@supabase/supabase-js";
import type { DishDetail } from "./restaurants";
import { allows, type ShowDiet } from "./diet";
import { dishSlug, keyFromDishSlug } from "./dishes";

// A food list ("Dosa", "Biryani"): fixed, set in the database. `region` is the food's home, for Tastes like home.
export type FoodList = { id: string; name: string; region: { name: string; demonym: string } | null };

// One dish's place in its list, from the dish_rankings view. rank is null until it's rated;
// home_avg (Tastes like home) is null under 3 ratings from the food's home region.
export type Ranking = { dish_id: string; space_id: string; rank: number | null; ratings: number; home_avg: number | null; home_count: number };

export type RankedDish = DishDetail & Omit<Ranking, "dish_id" | "space_id">;

const LIST_FIELDS = "id, name, region:regions(name, demonym)";

export const listHref = (name: string) => `/top/${encodeURIComponent(dishSlug(name))}`;

export async function getLists(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("spaces").select(LIST_FIELDS).order("name").returns<FoodList[]>();
  if (error) throw error;
  return data;
}

export async function getList(supabase: SupabaseClient, slug: string) {
  const { data, error } = await supabase.from("spaces").select(LIST_FIELDS).eq("name_key", keyFromDishSlug(slug)).maybeSingle<FoodList>();
  if (error) throw error;
  return data;
}

// Every listed dish's ranking row. shortcut: reads the whole view (fine for hundreds of dishes); filter per list once it grows.
export async function getRankings(supabase: SupabaseClient, filter?: { list?: string; dish?: string }) {
  let q = supabase.from("dish_rankings").select("dish_id, space_id, rank, ratings, home_avg, home_count");
  if (filter?.list) q = q.eq("space_id", filter.list);
  if (filter?.dish) q = q.eq("dish_id", filter.dish);
  const { data, error } = await q.returns<Ranking[]>();
  if (error) throw error;
  return data.map((r) => ({ ...r, home_avg: r.home_avg === null ? null : Number(r.home_avg) }));
}

// One list, best first: ranked dishes by rank (ties: more ratings, then name), then the unrated ones by name.
export async function getRankedList(supabase: SupabaseClient, listId: string): Promise<RankedDish[]> {
  const [rankings, dishes] = await Promise.all([
    getRankings(supabase, { list: listId }),
    supabase
      .from("dishes")
      .select("id, name, diet, rating_count, avg_score, restaurant:restaurants(slug, name, area)")
      .eq("space_id", listId)
      .returns<DishDetail[]>(),
  ]);
  if (dishes.error) throw dishes.error;
  return rankList(dishes.data, rankings);
}

export function rankList(dishes: DishDetail[], rankings: Ranking[]): RankedDish[] {
  const byDish = new Map(rankings.map((r) => [r.dish_id, r]));
  return dishes
    .map((d) => {
      const r = byDish.get(d.id);
      return { ...d, rank: r?.rank ?? null, ratings: r?.ratings ?? 0, home_avg: r?.home_avg ?? null, home_count: r?.home_count ?? 0 };
    })
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || b.ratings - a.ratings || a.name.localeCompare(b.name));
}

type Listed = {
  id: string;
  name: string;
  diet: DishDetail["diet"];
  space_id: string | null;
  avg_score: number | null;
  rating_count: number;
  restaurant: { slug: string; name: string };
};

// Dishes that sit in a list, for the Rankings tab.
export async function getListedDishes(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, diet, space_id, avg_score, rating_count, restaurant:restaurants(slug, name)")
    .not("space_id", "is", null)
    .returns<Listed[]>();
  if (error) throw error;
  return data;
}

// For the Rankings tab: each list with how many dishes it has and its current #1 among the dishes this person
// wants to see (the diet preference), or null while nothing visible is rated. Lists with no visible dish are left out;
// the most contested lists come first.
export function listLeaders(lists: FoodList[], dishes: Listed[], rankings: Ranking[], show: ShowDiet) {
  const rankOf = new Map(rankings.map((r) => [r.dish_id, r.rank]));
  return lists
    .flatMap((list) => {
    const mine = dishes.filter((d) => d.space_id === list.id && allows(show, d.diet));
    if (!mine.length) return [];
    const ranked = mine.filter((d) => rankOf.get(d.id) != null).sort((a, b) => rankOf.get(a.id)! - rankOf.get(b.id)!);
    return [{ list, count: mine.length, leader: ranked[0] ?? null }];
    })
    .sort((a, b) => b.count - a.count || a.list.name.localeCompare(b.list.name));
}

export type Leader = ReturnType<typeof listLeaders>[number];

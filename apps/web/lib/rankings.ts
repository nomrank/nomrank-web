import type { SupabaseClient } from "@supabase/supabase-js";
import type { DishDetail } from "./restaurants";
import { allows, type ShowDiet } from "./diet";
import { dishSlug, keyFromDishSlug } from "./dishes";
import type { City } from "./cities";

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
// With a `city`, only that city's dishes (the order is the same; positions are recounted by the page).
export async function getRankedList(supabase: SupabaseClient, listId: string, city: City | null = null): Promise<RankedDish[]> {
  const [rankings, dishes] = await Promise.all([
    getRankings(supabase, { list: listId }),
    (city ? dishesIn(listId).eq("restaurant.city", city) : dishesIn(listId)).returns<DishDetail[]>(),
  ]);
  if (dishes.error) throw dishes.error;
  return rankList(dishes.data, rankings);

  function dishesIn(id: string) {
    return supabase.from("dishes").select("id, name, diet, rating_count, avg_score, restaurant:restaurants!inner(slug, name, area)").eq("space_id", id);
  }
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
  restaurant: { slug: string; name: string; city: string };
};

// Dishes that sit in a list, for the Rankings tab.
export async function getListedDishes(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("dishes")
    .select("id, name, diet, space_id, avg_score, rating_count, restaurant:restaurants(slug, name, city)")
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

// Where a dish stands right now: its overall rating, and its place among the ranked dishes of its list in its own city.
export type Standing = {
  avg: number | null;
  ratings: number;
  position: number | null; // 1-based place in the city's ranking, null while unranked
  ranked: number; // how many dishes are ranked there
  list: string | null;
  city: string;
  home: { demonym: string; region: string; count: number; avg: number | null } | null; // Tastes like home, when the dish has a home region
};

// Place of `dishId` among the ranked dishes given: 1 + how many rank above it (a tie shares a place), null while unranked.
export function placeIn(list: { id: string; rank: number | null }[], dishId: string) {
  const ranked = list.filter((d) => d.rank !== null);
  const mine = ranked.find((d) => d.id === dishId);
  return { position: mine ? 1 + ranked.filter((d) => d.rank! < mine.rank!).length : null, ranked: ranked.length };
}

export type Move = { text: string; tone: "up" | "down" | "flat" };

// "Up 2", "Down 1", "Holding", or a first appearance. Positions are 1-based; smaller is better.
export function rankMove(before: number | null, after: number | null): Move | null {
  if (after === null) return null;
  if (before === null) return { text: "New in the ranking", tone: "up" };
  if (before === after) return { text: "Holding its place", tone: "flat" };
  return before > after ? { text: `Up ${before - after}`, tone: "up" } : { text: `Down ${after - before}`, tone: "down" };
}

// How the overall rating moved, to one decimal.
export function avgMove(before: number | null, after: number | null): Move | null {
  if (after === null) return null;
  if (before === null) return { text: "Its first rating", tone: "up" };
  const d = Math.round((after - before) * 10) / 10;
  if (d === 0) return { text: "Barely moved", tone: "flat" };
  return { text: `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}`, tone: d > 0 ? "up" : "down" };
}

export async function getStanding(supabase: SupabaseClient, dishId: string): Promise<Standing | null> {
  const { data: d, error } = await supabase
    .from("dishes")
    .select("avg_score, rating_count, space_id, space:spaces(name, region:regions(name, demonym)), restaurant:restaurants(city)")
    .eq("id", dishId)
    .maybeSingle<{
      avg_score: number | null;
      rating_count: number;
      space_id: string | null;
      space: { name: string; region: { name: string; demonym: string } | null } | null;
      restaurant: { city: string };
    }>();
  if (error) throw error;
  if (!d) return null;
  // Ids and ranks only (not whole dish rows): the dishes of this list in this city, and the list's rankings.
  const [inCity, rank] = await Promise.all([
    d.space_id
      ? supabase.from("dishes").select("id, restaurant:restaurants!inner(city)").eq("space_id", d.space_id).eq("restaurant.city", d.restaurant.city).returns<{ id: string }[]>()
      : Promise.resolve({ data: [] as { id: string }[], error: null }),
    getRankings(supabase, d.space_id ? { list: d.space_id } : { dish: dishId }),
  ]);
  if (inCity.error) throw inCity.error;
  const rankOf = new Map(rank.map((x) => [x.dish_id, x.rank]));
  const { position, ranked } = placeIn(inCity.data.map((x) => ({ id: x.id, rank: rankOf.get(x.id) ?? null })), dishId);
  const r = rank.find((x) => x.dish_id === dishId);
  return {
    avg: d.avg_score === null ? null : Number(d.avg_score),
    ratings: d.rating_count,
    position,
    ranked,
    list: d.space?.name ?? null,
    city: d.restaurant.city,
    home: d.space?.region ? { demonym: d.space.region.demonym, region: d.space.region.name, count: r?.home_count ?? 0, avg: r?.home_avg ?? null } : null,
  };
}

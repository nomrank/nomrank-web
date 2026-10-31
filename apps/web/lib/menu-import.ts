import { CITIES, type City } from "./cities";
import type { DishDiet } from "./diet";
import { dishKey } from "./dishes";
import { dishNameSchema, restaurantSchema, restaurantSlug } from "./validation";

// Turns the rows of an admin's menu sheet into restaurants and dishes, or says which rows need fixing. The same rules as
// adding them by hand: restaurant name up to 80 characters, area up to 60, dish name 2 to 60, one of the four cities.

export const MAX_MENU_ROWS = 1000;
export const MENU_HEADERS = ["Restaurant", "Area", "City", "Dish", "Diet", "List"] as const;

// One line of the sheet, checked. `dish`, `diet` and `list` are null on a line that only names a restaurant.
export type MenuRow = { line: number; restaurant: string; area: string; city: City; dish: string | null; diet: DishDiet | null; list: string | null; slug: string; slug_alt: string };
export type MenuProblem = { line: number; message: string };
// What an import added (or, in a preview, would add): the database counts, and food lists named in the sheet that don't exist.
export type ImportCounts = { restaurants_new: number; restaurants_existing: number; dishes_new: number; dishes_existing: number; unknown_lists: string[] };
export type MenuSheet = { rows: MenuRow[]; problems: MenuProblem[]; fatal?: string };

const letters = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

// The words people use for each column, so a sheet that says "Veg or non-veg" or "Place" still works.
const COLUMNS: Record<"restaurant" | "area" | "city" | "dish" | "diet" | "list", string[]> = {
  restaurant: ["restaurant", "restaurantname", "place", "placename", "hotel"],
  area: ["area", "locality", "neighbourhood", "neighborhood", "location"],
  city: ["city", "town"],
  dish: ["dish", "dishname", "item", "itemname"],
  diet: ["diet", "type", "vegornonveg", "vegnonveg", "dishtype"],
  list: ["list", "foodlist", "space", "category"],
};

const DIETS: Record<string, DishDiet> = {
  v: "veg", veg: "veg", vegetarian: "veg",
  nonveg: "non_veg", nonvegetarian: "non_veg", nv: "non_veg", meat: "non_veg",
  egg: "egg", eggetarian: "egg", e: "egg",
  vegan: "vegan",
};
const CITY_ALIASES: Record<string, string> = { bangalore: "bengaluru" }; // the old name, in letters only

export function parseMenuSheet(sheet: string[][]): MenuSheet {
  const headerAt = sheet.findIndex((r) => r.some((c) => c.trim()));
  if (headerAt < 0) return { rows: [], problems: [], fatal: "That sheet is empty." };

  const index: Partial<Record<keyof typeof COLUMNS, number>> = {};
  sheet[headerAt].forEach((cell, i) => {
    const key = letters(cell);
    for (const [name, words] of Object.entries(COLUMNS)) if (words.includes(key) && index[name as keyof typeof COLUMNS] === undefined) index[name as keyof typeof COLUMNS] = i;
  });
  const missing = (["restaurant", "area", "city"] as const).filter((k) => index[k] === undefined);
  if (missing.length) return { rows: [], problems: [], fatal: `The first row needs these headings: ${MENU_HEADERS.slice(0, 3).join(", ")} (and Dish and Diet for dishes). Missing: ${missing.map((m) => m[0].toUpperCase() + m.slice(1)).join(", ")}.` };

  const data = sheet.slice(headerAt + 1);
  if (data.filter((r) => r.some((c) => c.trim())).length > MAX_MENU_ROWS) {
    return { rows: [], problems: [], fatal: `That sheet has more than ${MAX_MENU_ROWS} rows. Split it into smaller files.` };
  }

  const rows: MenuRow[] = [];
  const problems: MenuProblem[] = [];
  const seen = new Set<string>();
  data.forEach((cells, i) => {
    const line = headerAt + i + 2; // the spreadsheet's own row number
    if (!cells.some((c) => c.trim())) return;
    const get = (k: keyof typeof COLUMNS) => (index[k] === undefined ? "" : (cells[index[k]!] ?? "").replace(/\s+/g, " ").trim());
    const fail = (message: string) => problems.push({ line, message });

    const place = restaurantSchema.safeParse({ name: get("restaurant"), area: get("area") });
    if (!place.success) return fail(place.error.issues[0].message);
    const cityText = get("city");
    const cityKey = letters(cityText);
    const city = CITIES.find((c) => letters(c) === (CITY_ALIASES[cityKey] ?? cityKey));
    if (!city) return fail(`"${cityText || "(blank)"}" isn't a launch city. Use Bengaluru, Mumbai, Delhi or Hyderabad.`);

    let dish: string | null = null;
    let diet: DishDiet | null = null;
    const dishText = get("dish");
    if (dishText) {
      const name = dishNameSchema.safeParse(dishText);
      if (!name.success) return fail(name.error.issues[0].message);
      diet = DIETS[letters(get("diet"))] ?? null;
      if (!diet) return fail(`Say whether "${name.data}" is Veg, Non-veg, Egg or Vegan.`);
      dish = name.data;
    }
    const list = get("list") || null;
    if (list && list.length > 40) return fail("Keep the food list name under 40 characters.");

    // The same restaurant and dish twice in one file counts once.
    const key = `${place.data.name.toLowerCase()}|${place.data.area.toLowerCase()}|${city}|${dish ? dishKey(dish) : ""}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ line, restaurant: place.data.name, area: place.data.area, city, dish, diet, list, slug: restaurantSlug(place.data.name), slug_alt: restaurantSlug(`${place.data.name} ${place.data.area}`) });
  });
  if (!rows.length && !problems.length) return { rows, problems, fatal: "There's nothing under the headings yet." };
  return { rows, problems };
}

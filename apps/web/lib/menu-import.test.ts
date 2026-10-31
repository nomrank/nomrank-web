import { describe, expect, it } from "vitest";
import { MAX_MENU_ROWS, parseMenuSheet } from "./menu-import";

const H = ["Restaurant", "Area", "City", "Dish", "Diet", "List"];

describe("parseMenuSheet", () => {
  it("reads restaurants and dishes, with the spreadsheet's own row numbers", () => {
    const out = parseMenuSheet([H, ["Paradise", "Secunderabad", "Hyderabad", "Chicken Dum Biryani", "Non-veg", "Biryani"], ["CTR", "Malleshwaram", "bengaluru", "Masala Dosa", "veg", ""]]);
    expect(out.problems).toEqual([]);
    expect(out.rows).toMatchObject([
      { line: 2, restaurant: "Paradise", area: "Secunderabad", city: "Hyderabad", dish: "Chicken Dum Biryani", diet: "non_veg", list: "Biryani", slug: "paradise", slug_alt: "paradise-secunderabad" },
      { line: 3, restaurant: "CTR", city: "Bengaluru", dish: "Masala Dosa", diet: "veg", list: null },
    ]);
  });

  it("finds the columns by their usual names, in any order, and skips blank lines above and between", () => {
    const out = parseMenuSheet([[], ["Veg or non-veg", "Item", "Place", "Locality", "Town"], ["Egg", "Egg Puff", "Iyengar Bakery", "Jayanagar", "Bangalore"], [""], ["Vegan", "Kale Salad", "Greens", "Bandra", "Mumbai"]]);
    expect(out.problems).toEqual([]);
    expect(out.rows.map((r) => [r.line, r.restaurant, r.city, r.dish, r.diet])).toEqual([
      [3, "Iyengar Bakery", "Bengaluru", "Egg Puff", "egg"],
      [5, "Greens", "Mumbai", "Kale Salad", "vegan"],
    ]);
  });

  it("accepts a line that only names a restaurant", () => {
    const out = parseMenuSheet([H, ["Karim's", "Jama Masjid", "Delhi", "", "", ""]]);
    expect(out.rows).toMatchObject([{ restaurant: "Karim's", dish: null, diet: null, list: null }]);
  });

  it("names the row and the problem, for every bad row, and keeps the good ones", () => {
    const out = parseMenuSheet([H, ["Paradise", "Sec", "Pune", "Biryani", "veg", ""], ["", "Sec", "Delhi", "x", "veg", ""], ["Cafe", "Area", "Delhi", "Tea", "", ""], ["Cafe", "Area", "Delhi", "T", "veg", ""], ["Cafe", "Area", "Delhi", "Chai", "veg", "L".repeat(41)], ["Good", "Spot", "Mumbai", "Pav", "veg", ""]]);
    expect(out.problems.map((p) => p.line)).toEqual([2, 3, 4, 5, 6]);
    expect(out.problems[0].message).toMatch(/Pune.*launch city/);
    expect(out.problems[2].message).toMatch(/Veg, Non-veg, Egg or Vegan/);
    expect(out.rows).toHaveLength(1);
  });

  it("counts the same restaurant and dish once, however it's spelled in case or spacing", () => {
    const out = parseMenuSheet([H, ["Paradise", "Sec", "Hyderabad", "Biryani", "non-veg", ""], ["paradise ", " sec", "hyderabad", "BIRYANI", "non-veg", ""], ["Paradise", "Sec", "Hyderabad", "Haleem", "non-veg", ""]]);
    expect(out.rows.map((r) => r.dish)).toEqual(["Biryani", "Haleem"]);
  });

  it("says plainly what's wrong with the file as a whole", () => {
    expect(parseMenuSheet([]).fatal).toMatch(/empty/);
    expect(parseMenuSheet([["Name", "Where"], ["x", "y"]]).fatal).toMatch(/Missing: Restaurant, Area, City/);
    expect(parseMenuSheet([H]).fatal).toMatch(/nothing under the headings/);
    const big = Array.from({ length: MAX_MENU_ROWS + 1 }, (_, i) => [`P${i}`, "A", "Delhi", "", "", ""]);
    expect(parseMenuSheet([H, ...big]).fatal).toMatch(/more than/);
  });

  it("strips stray spaces and line breaks inside cells", () => {
    const out = parseMenuSheet([H, ["  Paradise\n Biryani House ", "Sec", "Hyderabad", "Chicken\tDum  Biryani", "veg", ""]]);
    expect(out.rows[0]).toMatchObject({ restaurant: "Paradise Biryani House", dish: "Chicken Dum Biryani" });
  });
});

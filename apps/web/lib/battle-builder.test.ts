import { describe, expect, it } from "vitest";
import { battleCity, matchDishes, suggestTitle, type BattleDish } from "./battle-builder";

const dish = (id: string, name: string, place: string, city = "Hyderabad", area = "Banjara Hills"): BattleDish => ({ id, name, place, area, city, diet: "non_veg" });
const D = [
  dish("1", "Chicken Dum Biryani", "Paradise"),
  dish("2", "Chicken Dum Biryani", "Bawarchi"),
  dish("3", "Masala Dosa", "CTR", "Bengaluru", "Malleshwaram"),
  dish("4", "Paradise Special Kebab", "Shah Ghouse"),
];

describe("matchDishes", () => {
  it("needs every typed word, across name, place, area and city", () => {
    expect(matchDishes(D, "paradise biryani").map((d) => d.id)).toEqual(["1"]);
    expect(matchDishes(D, "dosa bengaluru").map((d) => d.id)).toEqual(["3"]);
    expect(matchDishes(D, "biryani zzz")).toEqual([]);
  });
  it("ignores case, accents and punctuation, and says nothing for an empty search", () => {
    expect(matchDishes(D, "  CTR!! ").map((d) => d.id)).toEqual(["3"]);
    expect(matchDishes(D, "")).toEqual([]);
    expect(matchDishes(D, "   ")).toEqual([]);
  });
  it("puts names that start with the first word first, and leaves out the other side's dish", () => {
    expect(matchDishes(D, "paradise").map((d) => d.id)).toEqual(["4", "1"]);
    expect(matchDishes(D, "biryani", "1").map((d) => d.id)).toEqual(["2"]);
  });
  it("stops at the limit", () => {
    expect(matchDishes(D, "a", null, 2)).toHaveLength(2);
  });
});

describe("suggestTitle", () => {
  it("names the matchup, and the places when both dishes have the same name", () => {
    expect(suggestTitle(D[0], D[2])).toBe("Chicken Dum Biryani vs Masala Dosa");
    expect(suggestTitle(D[0], D[1])).toBe("Paradise vs Bawarchi: Chicken Dum Biryani");
    expect(suggestTitle(D[0], null)).toBe("");
  });
  it("never goes over the 80 characters the database allows", () => {
    const long = dish("9", "x".repeat(60), "Place");
    expect(suggestTitle(long, dish("8", "y".repeat(60), "Place")).length).toBeLessThanOrEqual(80);
  });
});

describe("battleCity", () => {
  it("is the shared city, or null for a city war, or undefined until both are picked", () => {
    expect(battleCity(D[0], D[1])).toBe("Hyderabad");
    expect(battleCity(D[0], D[2])).toBeNull();
    expect(battleCity(D[0], null)).toBeUndefined();
  });
});

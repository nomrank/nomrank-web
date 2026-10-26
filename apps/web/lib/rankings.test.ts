import { describe, expect, it } from "vitest";
import { listHref, listLeaders, rankList, type FoodList, type Ranking } from "./rankings";
import type { DishDetail } from "./restaurants";

const place = { slug: "vb", name: "Vidyarthi Bhavan", area: "Basavanagudi" };
const dish = (id: string, name: string, diet: DishDetail["diet"] = "veg"): DishDetail => ({ id, name, diet, rating_count: 0, avg_score: null, restaurant: place });
const ranking = (dish_id: string, rank: number | null, ratings = 1): Ranking => ({ dish_id, space_id: "dosa", rank, ratings, home_avg: null, home_count: 0 });

describe("rankList", () => {
  it("puts ranked dishes in rank order, ties by more ratings, then unrated by name", () => {
    const list = rankList(
      [dish("u2", "Onion Dosa"), dish("b", "Benne Dosa"), dish("a", "Masala Dosa"), dish("u1", "Plain Dosa"), dish("t", "Set Dosa")],
      [ranking("a", 1, 9), ranking("b", 2, 3), ranking("t", 2, 7), ranking("u1", null, 0)],
    );
    expect(list.map((d) => d.id)).toEqual(["a", "t", "b", "u2", "u1"]);
    expect(list.at(-1)).toMatchObject({ rank: null, ratings: 0, home_avg: null });
  });
});

describe("listLeaders", () => {
  const lists: FoodList[] = [
    { id: "biryani", name: "Biryani", region: { name: "Hyderabad", demonym: "Hyderabadis" } },
    { id: "dosa", name: "Dosa", region: null },
    { id: "idli", name: "Idli", region: null },
  ];
  const dishes = [
    { id: "cb", name: "Chicken Biryani", diet: "non_veg" as const, space_id: "biryani", avg_score: 8.5, rating_count: 9, restaurant: place },
    { id: "vb", name: "Veg Biryani", diet: "veg" as const, space_id: "biryani", avg_score: 8, rating_count: 2, restaurant: place },
    { id: "md", name: "Masala Dosa", diet: "veg" as const, space_id: "dosa", avg_score: null, rating_count: 0, restaurant: place },
    { id: "sd", name: "Set Dosa", diet: "veg" as const, space_id: "dosa", avg_score: 7, rating_count: 7, restaurant: place },
    { id: "pd", name: "Plain Dosa", diet: "veg" as const, space_id: "dosa", avg_score: 6, rating_count: 1, restaurant: place },
  ];
  const rankings = [ranking("cb", 1), ranking("vb", 2), ranking("md", null, 0)];

  it("names each list's #1 (or none while unrated), busiest list first, and skips empty lists", () => {
    const out = listLeaders(lists, dishes, rankings, "all");
    expect(out.map((l) => [l.list.id, l.count, l.leader?.id ?? null])).toEqual([
      ["dosa", 3, null],
      ["biryani", 2, "cb"],
    ]);
  });

  it("follows the diet preference: a vegetarian sees the best veg biryani", () => {
    expect(listLeaders(lists, dishes, rankings, "veg").find((l) => l.list.id === "biryani")).toMatchObject({ count: 1, leader: { id: "vb" } });
  });
});

describe("listHref", () => {
  it("uses the dish-style slug", () => {
    expect(listHref("Bisi Bele Bath")).toBe("/top/bisi-bele-bath");
  });
});

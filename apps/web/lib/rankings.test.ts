import { describe, expect, it } from "vitest";
import { avgMove, listHref, listLeaders, placeIn, rankMove, rankList, type FoodList, type Ranking } from "./rankings";
import type { DishDetail } from "./restaurants";

const place = { slug: "vb", name: "Vidyarthi Bhavan", area: "Basavanagudi", city: "Bengaluru" };
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

describe("placeIn", () => {
  it("counts only ranked dishes; a tie shares a place", () => {
    const list = [{ id: "a", rank: 1 }, { id: "b", rank: 2 }, { id: "t", rank: 2 }, { id: "c", rank: null }];
    expect(placeIn(list, "b")).toEqual({ position: 2, ranked: 3 });
    expect(placeIn(list, "t")).toEqual({ position: 2, ranked: 3 });
    expect(placeIn(list, "c")).toEqual({ position: null, ranked: 3 });
    expect(placeIn(list, "zzz")).toEqual({ position: null, ranked: 3 });
  });
});

describe("rankMove", () => {
  it("says up when the number gets smaller, down when it grows", () => {
    expect(rankMove(5, 3)).toEqual({ text: "Up 2", tone: "up" });
    expect(rankMove(3, 4)).toEqual({ text: "Down 1", tone: "down" });
    expect(rankMove(2, 2)).toMatchObject({ tone: "flat" });
    expect(rankMove(null, 7)).toMatchObject({ tone: "up" });
    expect(rankMove(4, null)).toBeNull();
  });
});

describe("avgMove", () => {
  it("rounds to one decimal and flags no change", () => {
    expect(avgMove(8, 8.34)).toEqual({ text: "+0.3", tone: "up" });
    expect(avgMove(8.4, 7.9)).toEqual({ text: "−0.5", tone: "down" });
    expect(avgMove(8, 8.02)).toMatchObject({ tone: "flat" });
    expect(avgMove(null, 9)).toMatchObject({ tone: "up" });
    expect(avgMove(9, null)).toBeNull();
  });
});

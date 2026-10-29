import { describe, expect, it } from "vitest";
import { formatScore, groupMeals, scoreHeat, summarize, verdict, type Review } from "./ratings";

describe("summarize", () => {
  it("averages and buckets scores 1–10", () => {
    const s = summarize([8, 8.5, 9, 10, 1]);
    expect(s.count).toBe(5);
    expect(s.average).toBeCloseTo(7.3);
    expect(s.spread).toEqual([1, 0, 0, 0, 0, 0, 0, 2, 1, 1]);
  });

  it("counts a 0.5 in the first bar", () => {
    expect(summarize([0.5, 1, 1.5]).spread).toEqual([3, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it("handles no ratings", () => {
    expect(summarize([])).toEqual({ count: 0, average: null, spread: Array(10).fill(0) });
  });
});

describe("formatScore", () => {
  it.each([
    [8.5, "8.5"],
    [9, "9.0"],
    [10, "10"],
  ])("%s → %s", (score, text) => expect(formatScore(score)).toBe(text));
});

describe("verdict", () => {
  it.each([
    [10, "Must try"],
    [9, "Must try"],
    [8.9, "Order again"],
    [8, "Order again"],
    [7.9, "Clean plate"],
    [6.5, "Clean plate"],
    [6.4, "Just okay"],
    [5, "Just okay"],
    [4.9, "Skip it"],
    [3, "Skip it"],
    [2.5, "Send it back"],
    [1, "Send it back"],
  ])("%s → %s", (score, label) => expect(verdict(score).label).toBe(label));
});

describe("scoreHeat", () => {
  it("is full ketchup at 4 and below, full mustard from 9.5", () => {
    expect(scoreHeat(1)).toBe(0);
    expect(scoreHeat(4)).toBe(0);
    expect(scoreHeat(9.5)).toBe(1);
    expect(scoreHeat(10)).toBe(1);
  });

  it("separates mid scores", () => {
    expect(scoreHeat(6.5) - scoreHeat(5)).toBeGreaterThan(0.25);
  });
});

describe("groupMeals", () => {
  const take = (id: string, user: string, place: string, at: string) =>
    ({ id, author: { username: user }, dish: { name: id, restaurant: { slug: place, name: place, area: "" } }, created_at: at }) as Review;
  const ids = (groups: Review[][]) => groups.map((g) => g.map((r) => r.id));

  it("joins the same person at the same place within 6 hours, at the first take's spot", () => {
    const feed = [
      take("dosa", "asha", "ctr", "2026-10-22T09:00:00Z"),
      take("biryani", "ravi", "meghana", "2026-10-22T08:00:00Z"),
      take("coffee", "asha", "ctr", "2026-10-22T08:30:00Z"),
    ];
    expect(ids(groupMeals(feed))).toEqual([["dosa", "coffee"], ["biryani"]]);
  });

  it("keeps different people, different places and different days apart", () => {
    const feed = [
      take("a", "asha", "ctr", "2026-10-22T09:00:00Z"),
      take("b", "ravi", "ctr", "2026-10-22T09:10:00Z"),
      take("c", "asha", "mtr", "2026-10-22T09:20:00Z"),
      take("d", "asha", "ctr", "2026-10-21T09:00:00Z"),
    ];
    expect(ids(groupMeals(feed))).toEqual([["a"], ["b"], ["c"], ["d"]]);
  });

  it("chains takes that are each within the window of one already in the meal", () => {
    const feed = [
      take("a", "asha", "ctr", "2026-10-22T08:00:00Z"),
      take("b", "asha", "ctr", "2026-10-22T13:00:00Z"),
      take("c", "asha", "ctr", "2026-10-22T18:00:00Z"),
    ];
    expect(ids(groupMeals(feed))).toEqual([["a", "b", "c"]]);
  });
});

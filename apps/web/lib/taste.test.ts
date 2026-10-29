import { describe, expect, it } from "vitest";
import { badges, familyOf, profileFacts, tasteMatch } from "./taste";
import type { Review } from "./ratings";

let n = 0;
const rated = (name: string, place: string, score: number, opts: Partial<{ veg: boolean; take: string; at: string; photos: number }> = {}) =>
  ({
    score,
    take: opts.take ?? null,
    created_at: opts.at ?? `2026-10-${String(10 + (n++ % 15)).padStart(2, "0")}T07:00:00Z`,
    photos: Array.from({ length: opts.photos ?? 0 }, (_, i) => ({ path: `p${i}`, position: i + 1 })),
    dish: { name, diet: opts.veg === false ? "non_veg" : "veg", restaurant: { slug: place, name: place.toUpperCase(), area: "" } },
  }) as Review;

describe("familyOf", () => {
  it.each([
    ["Masala Dosa", "Dosa"],
    ["Ghee Podi Idli", "Idli"],
    ["Mutton Donne Biryani", "Biryani"],
    ["Ghee Rice", "Rice"],
    ["Kesari Bath", "Bath"],
    ["Mysore Pak", undefined],
  ])("%s → %s", (name, family) => expect(familyOf(name)).toBe(family));
});

describe("profileFacts", () => {
  it("finds the regular spot, diet and signature", () => {
    const ratings = [
      rated("Masala Dosa", "ctr", 9),
      rated("Benne Dosa", "ctr", 8),
      rated("Mangalore Bajji", "ctr", 7),
      rated("Idli", "mtr", 8),
      rated("Chicken Biryani", "meghana", 7, { veg: false }),
    ];
    expect(profileFacts(ratings)).toEqual({
      regularAt: { slug: "ctr", name: "CTR", count: 3 },
      diet: "Mostly veg",
      signature: "Dosa",
    });
  });

  it("stays quiet with too little to go on", () => {
    expect(profileFacts([rated("Masala Dosa", "ctr", 9), rated("Idli", "mtr", 8)])).toEqual({});
  });
});

describe("badges", () => {
  it("awards what was earned, nothing else", () => {
    const ratings = [
      ...["a", "b", "c", "d", "e"].map((p) => rated(`${p} Dosa`, p, 8, { photos: 1 })),
      rated("Chicken Biryani", "f", 7, { veg: false, take: "Good", at: "2026-10-20T18:30:00Z" }), // 00:00 in India
    ];
    expect(badges(ratings, 30).map((b) => b.id)).toEqual(["first-take", "explorer", "trusted", "dosa-devotee", "shutterbug"]);
  });

  it("gives nothing to someone who hasn't started", () => {
    expect(badges([], 0)).toEqual([]);
  });
});

describe("tasteMatch", () => {
  const mine = [rated("Masala Dosa", "ctr", 9), rated("Idli", "mtr", 8), rated("Filter Coffee", "bcb", 7), rated("Vada", "bcb", 6)];

  it("needs 3 dishes in common", () => {
    expect(tasteMatch(mine, [rated("Masala Dosa", "ctr", 9), rated("Idli", "mtr", 8)])).toEqual({ common: 2, percent: null });
  });

  it("is 100% for identical scores, with no split", () => {
    expect(tasteMatch(mine, mine)).toEqual({ common: 4, percent: 100, split: undefined });
  });

  it("scores the gap and names the biggest split", () => {
    const theirs = [rated("Masala Dosa", "ctr", 4), rated("Idli", "mtr", 8), rated("Filter Coffee", "bcb", 7)];
    expect(tasteMatch(mine, theirs)).toEqual({
      common: 3,
      percent: Math.round(100 * (1 - 5 / 3 / 9.5)),
      split: { dish: "Masala Dosa", place: "CTR", mine: 9, theirs: 4 },
    });
  });

  it("only matches the same dish at the same place", () => {
    const elsewhere = mine.map((r) => rated(r.dish.name, "other", r.score));
    expect(tasteMatch(mine, elsewhere).common).toBe(0);
  });
});

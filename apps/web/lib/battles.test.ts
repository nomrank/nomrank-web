import { describe, expect, it } from "vitest";
import { split } from "./battles";

describe("split", () => {
  it("is 50/50 before anyone votes", () => {
    expect(split({ a: 0, b: 0 })).toEqual({ a: 50, b: 50, n: 0 });
  });
  it("adds up to 100", () => {
    for (const [a, b] of [[1, 2], [2, 1], [5, 3], [7, 7], [1, 0], [0, 9]]) {
      const s = split({ a, b });
      expect(s.a + s.b).toBe(100);
    }
    expect(split({ a: 3, b: 1 })).toEqual({ a: 75, b: 25, n: 4 });
  });
});

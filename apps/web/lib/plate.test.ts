import { describe, expect, it } from "vitest";
import { angleOf, scoreAtAngle, sector } from "./plate";

describe("scoreAtAngle", () => {
  it("round-trips every half step from the middle of its half-slice", () => {
    for (let n = 1; n <= 20; n++) expect(scoreAtAngle((n - 0.5) * 18)).toBe(n / 2);
  });

  it("reads 0.5 at the top and 10 just before it", () => {
    expect(scoreAtAngle(0)).toBe(0.5);
    expect(scoreAtAngle(359)).toBe(10);
  });

  it("splits a slice: first half is x.5, second half is x", () => {
    expect(scoreAtAngle(40)).toBe(1.5); // slice 2, first half
    expect(scoreAtAngle(60)).toBe(2); // slice 2, second half
  });

  it("stops at the ends while dragging instead of wrapping", () => {
    expect(scoreAtAngle(3, 9.5)).toBe(10);
    expect(scoreAtAngle(350, 1.5)).toBe(0.5);
    expect(scoreAtAngle(350)).toBe(10); // a fresh tap isn't a drag
  });
});

describe("sector", () => {
  it("keeps at most 2 decimals, so server and browser render the same markup", () => {
    expect(sector(7, 29, 137, 91)).not.toMatch(/\.\d{3,}/);
  });
});

describe("angleOf", () => {
  it("is 0 straight up and 90 to the right", () => {
    expect(angleOf(0, -10)).toBe(0);
    expect(angleOf(10, 0)).toBe(90);
  });
});

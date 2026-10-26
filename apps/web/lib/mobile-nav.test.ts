import { describe, expect, it } from "vitest";
import { hidesMobileNav } from "./mobile-nav";

describe("hidesMobileNav", () => {
  it.each(["/login", "/onboarding", "/rate", "/rate/", "/reset-password", "/suspended", "/coming-soon"])("hides on %s", (p) => {
    expect(hidesMobileNav(p)).toBe(true);
  });

  it.each(["/", "/notifications", "/u/ann", "/r/meghana-foods/biryani", "/top/biryani", "/rater", "/settings"])("shows on %s", (p) => {
    expect(hidesMobileNav(p)).toBe(false);
  });
});

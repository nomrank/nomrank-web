import { describe, expect, it } from "vitest";
import { asCity } from "./cities";

describe("asCity", () => {
  it("accepts the launch cities only", () => {
    expect(asCity("Mumbai")).toBe("Mumbai");
    expect(asCity("mumbai")).toBeNull();
    expect(asCity("Chennai")).toBeNull();
    expect(asCity(undefined)).toBeNull();
  });
});

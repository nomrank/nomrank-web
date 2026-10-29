import { describe, expect, it } from "vitest";
import { commentSchema, dishNameSchema, emailSchema, favouritesSchema, isAtLeast13, passwordSchema, preferencesSchema, privacySchema, profileSchema, ratingSchema, reportSchema, restaurantSchema, restaurantSlug, signupDetailsSchema, usernameSchema } from "./validation";

describe("usernameSchema", () => {
  it.each([
    ["biryani_bro", "biryani_bro"],
    ["  Dosa_Queen ", "dosa_queen"],
    ["@ghee_roast", "ghee_roast"],
    ["abc", "abc"],
    ["a".repeat(20), "a".repeat(20)],
  ])("accepts %j as %j", (input, expected) => {
    expect(usernameSchema.parse(input)).toBe(expected);
  });

  it.each(["ab", "a".repeat(21), "has space", "dash-name", "émile", "", "@"])("rejects %j", (input) => {
    expect(usernameSchema.safeParse(input).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("trims and lowercases", () => {
    expect(emailSchema.parse("  Me@Example.COM ")).toBe("me@example.com");
  });

  it("rejects junk", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("dishNameSchema", () => {
  it("tidies spacing", () => {
    expect(dishNameSchema.parse("  Set   Dosa ")).toBe("Set Dosa");
  });

  it.each(["a", " ", "x".repeat(61), "!!", "—"])("rejects %j", (input) => {
    expect(dishNameSchema.safeParse(input).success).toBe(false);
  });

  it("accepts non-Latin names", () => {
    expect(dishNameSchema.parse("ಮಸಾಲೆ ದೋಸೆ")).toBe("ಮಸಾಲೆ ದೋಸೆ");
  });
});

describe("ratingSchema", () => {
  it("accepts a bare score and empties the take to null", () => {
    expect(ratingSchema.parse({ score: "8", take: "   " })).toEqual({ score: 8, take: null });
  });

  it("trims takes", () => {
    expect(ratingSchema.parse({ score: 10, take: "  peak  " }).take).toBe("peak");
  });

  it("accepts half steps", () => {
    expect(ratingSchema.parse({ score: "8.5", take: "" }).score).toBe(8.5);
  });

  it("accepts 0.5 as the lowest score", () => {
    expect(ratingSchema.parse({ score: "0.5", take: "" }).score).toBe(0.5);
  });

  it.each([0, 0.25, 11, 7.25, "x"])("rejects score %j", (score) => {
    expect(ratingSchema.safeParse({ score, take: "" }).success).toBe(false);
  });

  it("rejects takes over 500 characters", () => {
    expect(ratingSchema.safeParse({ score: 5, take: "x".repeat(501) }).success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("trims", () => {
    expect(commentSchema.parse("  big if true  ")).toBe("big if true");
  });

  it.each(["", "   ", "x".repeat(501)])("rejects %j", (input) => {
    expect(commentSchema.safeParse(input).success).toBe(false);
  });
});

describe("signupDetailsSchema", () => {
  it("needs a birthday showing 13 or older; the rest can stay empty", () => {
    const base = { display_name: "", diet: "", gender: "" };
    expect(signupDetailsSchema.safeParse({ ...base, date_of_birth: "" }).error?.issues[0].message).toBe("Add your date of birth.");
    expect(signupDetailsSchema.safeParse({ ...base, date_of_birth: "2020-01-01" }).success).toBe(false);
    expect(signupDetailsSchema.parse({ ...base, display_name: " Asha ", date_of_birth: "2001-05-04" })).toEqual({
      display_name: "Asha",
      diet: null,
      date_of_birth: "2001-05-04",
      gender: null,
    });
  });
});

describe("profileSchema", () => {
  const ok = {
    display_name: "  Asha  ",
    bio: "",
    avatar: "2a31",
    diet: "eggetarian",
    instagram: "https://www.instagram.com/asha.eats/",
    date_of_birth: "2001-05-04",
    gender: "female",
    home_region: "hyderabad",
  };

  it("trims, cleans the Instagram link, and empties become null", () => {
    expect(profileSchema.parse(ok)).toEqual({
      display_name: "Asha",
      bio: null,
      avatar: "2a31",
      diet: "eggetarian",
      instagram: "asha.eats",
      date_of_birth: "2001-05-04",
      gender: "female",
      home_region: "hyderabad",
    });
  });

  it("leaves every optional field empty", () => {
    const empty = { display_name: "", bio: "", avatar: "0000", diet: "", instagram: "", date_of_birth: "", gender: "", home_region: "kerala" };
    expect(profileSchema.parse(empty)).toEqual({
      display_name: null,
      bio: null,
      avatar: "0000",
      diet: null,
      instagram: null,
      date_of_birth: null,
      gender: null,
      home_region: "kerala",
    });
  });

  it("accepts @handle for Instagram", () => {
    expect(profileSchema.parse({ ...ok, instagram: "@asha.eats" }).instagram).toBe("asha.eats");
  });

  it.each([
    ["a long name", { display_name: "x".repeat(41) }],
    ["a long bio", { bio: "x".repeat(161) }],
    ["a bad avatar code", { avatar: "NOPE" }],
    ["an unknown diet", { diet: "carnivore" }],
    ["a missing home region", { home_region: "" }],
    ["a bad Instagram handle", { instagram: "not a handle!" }],
    ["a half date", { date_of_birth: "2001-05" }],
    ["a birthday before 1900", { date_of_birth: "1899-12-31" }],
    ["an under-13 birthday", { date_of_birth: new Date().toISOString().slice(0, 10) }],
    ["an unknown gender", { gender: "robot" }],
  ])("rejects %s", (_, change) => {
    expect(profileSchema.safeParse({ ...ok, ...change }).success).toBe(false);
  });
});

describe("isAtLeast13", () => {
  const today = new Date(Date.UTC(2026, 9, 22));
  it.each([
    ["2013-10-22", true],
    ["2013-10-23", false],
    ["1990-01-01", true],
  ])("%s → %s", (dob, ok) => expect(isAtLeast13(dob, today)).toBe(ok));
});

describe("favouritesSchema", () => {
  const id = "3f1c2a9e-5b7d-4c11-9a2e-0d4b6f8a1c3e";
  it("accepts up to 4 distinct ids", () => {
    expect(favouritesSchema.parse([id])).toEqual([id]);
  });
  it.each([
    ["five", Array(5).fill(id)],
    ["a repeat", [id, id]],
    ["a non-id", ["dosa"]],
  ])("rejects %s", (_, ids) => {
    expect(favouritesSchema.safeParse(ids).success).toBe(false);
  });
});

describe("reportSchema", () => {
  const ok = { target_type: "rating", target_id: "3f1c2a9e-5b7d-4c11-9a2e-0d4b6f8a1c3e", reason: "spam", note: "  promo link  " };
  it("trims the note, empty note is null", () => {
    expect(reportSchema.parse(ok).note).toBe("promo link");
    expect(reportSchema.parse({ ...ok, note: " " }).note).toBeNull();
  });
  it.each([
    ["an unknown target", { target_type: "profile" }],
    ["a bad id", { target_id: "dosa" }],
    ["no reason", { reason: "" }],
    ["a dish reason on a take", { reason: "duplicate" }],
    ["a long note", { note: "x".repeat(301) }],
  ])("rejects %s", (_, change) => {
    expect(reportSchema.safeParse({ ...ok, ...change }).success).toBe(false);
  });
});

describe("preferencesSchema", () => {
  it("accepts the known choices", () => {
    expect(preferencesSchema.parse({ show_diet: "egg", feed_default: "following" })).toEqual({ show_diet: "egg", feed_default: "following" });
  });
  it.each([
    [{ show_diet: "meat", feed_default: "top" }],
    [{ show_diet: "all", feed_default: "hot" }],
  ])("rejects %j", (input) => {
    expect(preferencesSchema.safeParse(input).success).toBe(false);
  });
});

describe("privacySchema", () => {
  it("takes the three levels and nothing else", () => {
    expect(privacySchema.parse({ saves_visibility: "followers", diary_visibility: "only_me" })).toEqual({ saves_visibility: "followers", diary_visibility: "only_me" });
    expect(privacySchema.safeParse({ saves_visibility: "friends", diary_visibility: "everyone" }).success).toBe(false);
  });
});

describe("restaurantSchema / restaurantSlug", () => {
  it("trims and checks the name and area", () => {
    expect(restaurantSchema.parse({ name: "  Brahmin's Coffee Bar ", area: " Basavanagudi " })).toEqual({ name: "Brahmin's Coffee Bar", area: "Basavanagudi" });
    expect(restaurantSchema.safeParse({ name: "x", area: "Jayanagar" }).success).toBe(false);
  });
  it.each([
    ["CTR (Central Tiffin Room)", "ctr-central-tiffin-room"],
    ["Brahmin's Coffee Bar", "brahmin-s-coffee-bar"],
    ["Café Noir", "cafe-noir"],
    ["!!!", "place"],
  ])("%s → %s", (name, slug) => expect(restaurantSlug(name)).toBe(slug));
});

describe("passwordSchema", () => {
  it.each([
    ["short", false],
    ["1234567", false],
    ["12345678", true],
    ["a".repeat(72), true],
    ["a".repeat(73), false],
  ])("%s → %s", (password, ok) => expect(passwordSchema.safeParse(password).success).toBe(ok));
});

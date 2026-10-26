import { z } from "zod";
import { dishKey } from "./dishes";

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("That email doesn't look right. Check for typos."));

// 8 to 72 characters: 72 is bcrypt's limit, past which Supabase would silently ignore the rest. Keep the minimum in
// step with Supabase's password setting (Authentication, Sign In / Providers).
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer.");

// Mirrors the profiles.username check constraint in the database.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((s) => s.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .min(3, "At least 3 characters.")
      .max(20, "20 characters max.")
      .regex(/^[a-z0-9_]+$/, "Only letters, numbers and _ work here."),
  );

// Mirrors the dishes.name checks in the database (trimmed, 2–60 chars, not just symbols).
export const dishNameSchema = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, "Give the dish a name (at least 2 characters).")
      .max(60, "Keep it under 60 characters.")
      .refine((s) => dishKey(s) !== "", "Use letters, not just symbols."),
  );

// Mirrors public.ratings checks: score 1–10 in half steps, optional take (trimmed, ≤500).
export const ratingSchema = z.object({
  score: z.coerce
    .number()
    .min(1, "Pick a score from 1 to 10.")
    .max(10, "Pick a score from 1 to 10.")
    .refine((n) => Number.isInteger(n * 2), "Scores go in half steps, like 8.5."),
  take: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(500, "Keep the take under 500 characters."))
    .transform((s) => s || null),
});

// Mirrors public.comments.body: trimmed, 1–500 characters.
export const commentSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(1, "Write something first.").max(500, "Keep it under 500 characters."));

// Optional text: trimmed, and empty means "not set" (null). Mirrors the profiles checks.
const optionalText = (max: number, message: string) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(max, message))
    .transform((s) => s || null);

// True when someone born on `dob` (YYYY-MM-DD) is at least 13 on `today`.
export function isAtLeast13(dob: string, today = new Date()) {
  const [y, m, d] = dob.split("-").map(Number);
  const cutoff = new Date(Date.UTC(today.getUTCFullYear() - 13, today.getUTCMonth(), today.getUTCDate()));
  return Date.UTC(y, m - 1, d) <= cutoff.getTime();
}

// Optional choice from a fixed list: "" means "not set" (null).
const optionalChoice = <T extends string>(values: readonly [T, ...T[]], message: string) =>
  z.union([z.literal("").transform(() => null), z.enum(values, message)]);

// Mirrors public.profiles and public.profile_private checks.
export const profileSchema = z.object({
  display_name: optionalText(40, "Keep your name under 40 characters."),
  bio: optionalText(160, "Keep your bio under 160 characters."),
  avatar: z.string().regex(/^[0-9a-z]{4}$/, "Pick your avatar again."),
  diet: optionalChoice(["veg", "eggetarian", "vegan", "non_veg"], "Pick a food preference from the list."),
  // People paste "@handle" or a profile URL; keep just the handle.
  instagram: z
    .string()
    .transform((s) => s.trim().replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9._]{1,30}$/, "That doesn't look like an Instagram handle.")]))
    .transform((s) => s || null),
  date_of_birth: z
    .string()
    .transform((s) => s.trim())
    .pipe(
      z.union([
        z.literal(""),
        z.iso
          .date("Enter your date of birth as a full date.")
          .refine((d) => d >= "1900-01-01", "Check the year of your date of birth.")
          .refine((d) => isAtLeast13(d), "You need to be at least 13 to use Nomrank."),
      ]),
    )
    .transform((s) => s || null),
  gender: optionalChoice(["female", "male", "non_binary", "prefer_not_to_say"], "Pick a gender from the list."),
  // The database checks it's a real region (foreign key) and the 30-day limit.
  home_region: z.string().regex(/^[a-z0-9-]+$/, "Pick a home region from the list."),
});

// Sign-up's "About you" step: name, food preference and gender are optional; the birthday is required (13+).
export const signupDetailsSchema = profileSchema
  .pick({ display_name: true, diet: true, date_of_birth: true, gender: true })
  .refine((d) => d.date_of_birth !== null, { message: "Add your date of birth.", path: ["date_of_birth"] });

// Mirrors set_favourites: up to 4 of your own ratings, each once.
export const favouritesSchema = z
  .array(z.uuid())
  .max(4, "Pin up to 4 favourites.")
  .refine((ids) => new Set(ids).size === ids.length, "Each favourite can be pinned once.");

// Mirrors public.reports: what's being reported, why (reasons differ for takes, comments and dishes, as in the
// database check), and an optional note (≤300).
export const REPORT_REASONS = {
  rating: [
    { value: "fake", label: "Fake or paid review", hint: "Didn't eat it, or rated for the restaurant" },
    { value: "off_topic", label: "Not about the food", hint: "Rants, ads or anything off the plate" },
    { value: "wrong_dish", label: "Wrong dish or place", hint: "The take is about something else" },
    { value: "abusive", label: "Rude, hateful or harassing", hint: "Attacks people, not the food" },
    { value: "photo", label: "Inappropriate photo", hint: "Not food, offensive, or someone's private photo" },
    { value: "spam", label: "Spam or self-promotion", hint: "Links, promo codes, repeated posts" },
    { value: "other", label: "Something else", hint: "" },
  ],
  comment: [
    { value: "abusive", label: "Rude, hateful or harassing", hint: "Attacks people, not the food" },
    { value: "spam", label: "Spam or self-promotion", hint: "Links, promo codes, repeated posts" },
    { value: "off_topic", label: "Off topic", hint: "Nothing to do with the take or the dish" },
    { value: "other", label: "Something else", hint: "" },
  ],
  dish: [
    { value: "duplicate", label: "Duplicate dish", hint: "Already on this menu under another name" },
    { value: "not_on_menu", label: "Not on the menu", hint: "This place doesn't serve it" },
    { value: "wrong_place", label: "Wrong restaurant", hint: "It belongs to a different place" },
    { value: "misspelled", label: "Misspelled name", hint: "" },
    { value: "wrong_diet", label: "Wrong veg / non-veg mark", hint: "" },
    { value: "inappropriate", label: "Inappropriate name", hint: "" },
    { value: "other", label: "Something else", hint: "" },
  ],
} as const;

export type ReportTarget = keyof typeof REPORT_REASONS;

export const reportSchema = z
  .object({
    target_type: z.enum(["rating", "comment", "dish"]),
    target_id: z.uuid(),
    reason: z.string(),
    note: optionalText(300, "Keep the note under 300 characters."),
  })
  .refine((r) => REPORT_REASONS[r.target_type].some((x) => x.value === r.reason), { message: "Pick a reason.", path: ["reason"] });

// Mirrors the profiles visibility checks: who sees your "Want to try" list and your Diary.
const visibility = z.enum(["everyone", "followers", "only_me"], "Pick who can see it.");
export const privacySchema = z.object({ saves_visibility: visibility, diary_visibility: visibility });

// Mirrors public.profile_private preference checks.
export const preferencesSchema = z.object({
  show_diet: z.enum(["all", "vegan", "veg", "egg"], "Pick which dishes to show."),
  feed_default: z.enum(["top", "new", "following"], "Pick a default feed."),
});

// Admins adding a restaurant. Mirrors public.restaurants (name ≤ 80, area ≤ 60).
export const restaurantSchema = z.object({
  name: z.string().trim().min(2, "Give the restaurant's name.").max(80, "Keep the name under 80 characters."),
  area: z.string().trim().min(2, "Add the area it's in.").max(60, "Keep the area under 60 characters."),
});

// URL slug for a restaurant: lowercase words joined by hyphens ("CTR (Central Tiffin Room)" → "ctr-central-tiffin-room").
export const restaurantSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "") // drop accents: "Café" → "cafe"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "place";

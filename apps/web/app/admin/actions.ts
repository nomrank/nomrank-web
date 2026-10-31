"use server";

import { createHash, randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { ADMIN_FROM, adminInviteEmail, adminRemovedEmail } from "@/lib/admin-email";
import { ADMIN_NEXT_COOKIE, inviteNext, inviteProblem, inviteUrl, isAdminOrigin, signInEmail } from "@/lib/superadmin";
import { isAdmin } from "@/lib/admin";
import { emailSchema, passwordSchema, restaurantSchema, restaurantSlug } from "@/lib/validation";
import { asCity } from "@/lib/cities";
import { parseMenuSheet, type ImportCounts, type MenuProblem } from "@/lib/menu-import";
import { readFirstSheet, SheetError } from "@/lib/xlsx-read";

// Every admin action runs as the signed-in admin; the database functions check is_admin() again and log it.
// These only validate input, call the function, and clean up photo files the database can't delete.

export type AdminResult = { error?: string; ok?: number };

const id = z.uuid();
const target = z.enum(["rating", "comment", "dish", "space"]);

async function admin() {
  const { supabase } = await getCurrentUser();
  if (!(await isAdmin(supabase))) notFound();
  return supabase;
}

const failed = (message: string): AdminResult => ({ error: message });

export async function approveDish(dishId: string): Promise<AdminResult> {
  if (!id.safeParse(dishId).success) return failed("That dish id isn't valid.");
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_approve_dish", { dish: dishId });
  if (error) return failed("Couldn't approve that. Try again.");
  refresh();
  return { ok: Date.now() };
}

// Delete a take, comment or dish (and settle its reports), then remove any photo files it had.
export async function removeContent(type: string, targetId: string, note?: string): Promise<AdminResult> {
  const kind = target.safeParse(type);
  if (!kind.success || !id.safeParse(targetId).success) return failed("That item isn't valid.");
  const supabase = await admin();
  const { data: paths, error } = await supabase.rpc("admin_delete", { target_type: kind.data, target: targetId, note: note?.slice(0, 300) || null });
  if (error) return failed("Couldn't remove that. Try again.");
  if (paths?.length) await supabase.storage.from("rating-photos").remove(paths as string[]); // best effort: a leftover file is harmless
  refresh();
  return { ok: Date.now() };
}

export async function dismissReports(type: string, targetId: string): Promise<AdminResult> {
  const kind = target.safeParse(type);
  if (!kind.success || !id.safeParse(targetId).success) return failed("That item isn't valid.");
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_dismiss_reports", { target_type: kind.data, target: targetId });
  if (error) return failed("Couldn't dismiss those reports. Try again.");
  refresh();
  return { ok: Date.now() };
}

// Ban (optionally deleting all their takes and comments) or unban an account.
export async function setBan(account: string, banned: boolean, reason = "", purge = false): Promise<AdminResult> {
  if (!id.safeParse(account).success) return failed("That account id isn't valid.");
  const supabase = await admin();
  const { data: paths, error } = await supabase.rpc("admin_set_ban", { account, banned, reason: reason.trim().slice(0, 300) || null, purge: banned && purge });
  if (error) return failed(error.message.includes("admins") ? "Admins can't be banned." : "Couldn't update that account. Try again.");
  if (paths?.length) await supabase.storage.from("rating-photos").remove(paths as string[]);
  refresh();
  return { ok: Date.now() };
}

// Add a restaurant. The slug comes from the name; if it's taken, the area goes on the end, then a number.
export async function addRestaurant(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const parsed = restaurantSchema.safeParse({ name: formData.get("name"), area: formData.get("area") });
  if (!parsed.success) return failed(parsed.error.issues[0].message);
  const city = asCity(formData.get("city"));
  if (!city) return failed("Pick the city.");
  const supabase = await admin();
  const escape = (s: string) => s.replace(/[%_\\]/g, "\\$&");
  const { data: same } = await supabase
    .from("restaurants")
    .select("slug")
    .ilike("name", escape(parsed.data.name))
    .ilike("area", escape(parsed.data.area))
    .eq("city", city)
    .limit(1);
  if (same?.length) return failed(`That place is already listed (/r/${same[0].slug}).`);
  const base = restaurantSlug(parsed.data.name);
  const candidates = [base, `${base}-${restaurantSlug(parsed.data.area)}`, ...[2, 3, 4, 5].map((n) => `${base}-${n}`)];
  for (const slug of candidates) {
    const { error } = await supabase.rpc("admin_add_restaurant", { slug, name: parsed.data.name, area: parsed.data.area, city });
    if (!error) {
      refresh();
      return { ok: Date.now() };
    }
    if (error.code !== "23505") return failed("Couldn't add that restaurant. Try again.");
  }
  return failed("A restaurant with that name already exists in several areas. Add the area to the name.");
}

const diet = z.enum(["veg", "vegan", "egg", "non_veg"]);
const dishName = z.string().trim().min(2, "Give the dish a name (at least 2 characters).").max(60, "Keep it under 60 characters.");

export async function updateRestaurant(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const placeId = id.safeParse(formData.get("id"));
  const parsed = restaurantSchema.safeParse({ name: formData.get("name"), area: formData.get("area") });
  const city = asCity(formData.get("city"));
  if (!placeId.success) return failed("That restaurant isn't valid.");
  if (!parsed.success) return failed(parsed.error.issues[0].message);
  if (!city) return failed("Pick the city.");
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_update_restaurant", { target: placeId.data, name: parsed.data.name, area: parsed.data.area, city });
  if (error) return failed("Couldn't save that. Try again.");
  refresh();
  return { ok: Date.now() };
}

// Delete a restaurant, its dishes and their takes, then the photo files.
export async function deleteRestaurant(placeId: string): Promise<AdminResult> {
  if (!id.safeParse(placeId).success) return failed("That restaurant isn't valid.");
  const supabase = await admin();
  const { data: paths, error } = await supabase.rpc("admin_delete_restaurant", { target: placeId });
  if (error) return failed("Couldn't delete that restaurant. Try again.");
  if (paths?.length) await supabase.storage.from("rating-photos").remove(paths as string[]);
  refresh();
  return { ok: Date.now() };
}

// An admin's new dish is approved straight away (a database trigger) and joins its food list by name.
export async function addDish(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const placeId = id.safeParse(formData.get("restaurant_id"));
  const name = dishName.safeParse(formData.get("name"));
  const kind = diet.safeParse(formData.get("diet"));
  if (!placeId.success) return failed("That restaurant isn't valid.");
  if (!name.success) return failed(name.error.issues[0].message);
  if (!kind.success) return failed("Pick veg, vegan, egg or non-veg.");
  const { supabase, userId } = await getCurrentUser();
  if (!(await isAdmin(supabase))) notFound();
  const { error } = await supabase.from("dishes").insert({ restaurant_id: placeId.data, name: name.data, diet: kind.data, created_by: userId });
  if (error) return failed(error.code === "23505" ? "That dish is already on this menu." : "Couldn't add that dish. Try again.");
  refresh();
  return { ok: Date.now() };
}

export async function updateDish(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const dishId = id.safeParse(formData.get("id"));
  const name = dishName.safeParse(formData.get("name"));
  const kind = diet.safeParse(formData.get("diet"));
  if (!dishId.success) return failed("That dish isn't valid.");
  if (!name.success) return failed(name.error.issues[0].message);
  if (!kind.success) return failed("Pick veg, vegan, egg or non-veg.");
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_update_dish", { target: dishId.data, name: name.data, diet: kind.data });
  if (error) return failed(error.code === "23505" ? "That name is already on this menu." : "Couldn't save that dish. Try again.");
  refresh();
  return { ok: Date.now() };
}

// Admins join by invitation, and only the superadmin invites or removes (the database enforces that). An invitation is a
// random token in an emailed link; the database keeps only its hash.
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

async function adminOrigin() {
  const h = await headers();
  return h.get("origin") ?? `http://${h.get("host")}`;
}

export async function inviteAdmin(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const email = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!email.success) return failed(email.error.issues[0].message);
  const { supabase, profile } = await getCurrentUser();
  if (!(await isAdmin(supabase))) notFound();
  const origin = await adminOrigin();
  if (!isAdminOrigin(origin)) return failed("Send invitations from the admin site (admin.nomrank.in).");
  const token = randomBytes(32).toString("base64url");
  const { error } = await supabase.rpc("admin_create_invite", { invite_email: email.data.toLowerCase(), hash: sha256(token) });
  if (error) {
    if (error.code === "23505") return failed("They're already an admin.");
    if (error.message.includes("superadmin")) return failed("Only the superadmin can invite admins.");
    if (error.message.includes("default password")) return failed("Change the default password first.");
    return failed("Couldn't create the invitation. Try again.");
  }
  try {
    await sendEmail({ from: ADMIN_FROM, to: email.data, ...adminInviteEmail({ url: inviteUrl(origin, token), inviter: profile?.username ? `@${profile.username}` : "A Nomrank admin" }) });
  } catch {
    return failed("The invitation was saved but the email didn't send. Cancel it and try again.");
  }
  refresh();
  return { ok: Date.now() };
}

export async function cancelInvite(inviteId: string): Promise<AdminResult> {
  if (!id.safeParse(inviteId).success) return failed("That invitation isn't valid.");
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_cancel_invite", { invite: inviteId });
  if (error) return failed("Couldn't cancel that invitation. Try again.");
  refresh();
  return { ok: Date.now() };
}

// Remove an admin, then tell them by email (best effort: the removal already happened).
export async function removeAdmin(account: string): Promise<AdminResult> {
  if (!id.safeParse(account).success) return failed("That account isn't valid.");
  const supabase = await admin();
  const { data: email, error } = await supabase.rpc("admin_remove_admin", { account });
  if (error) return failed(error.message.includes("superadmin can") ? "The superadmin can't be removed." : "Couldn't remove that admin. Try again.");
  if (typeof email === "string" && email && !email.endsWith("@admin.nomrank.in")) {
    try {
      await sendEmail({ from: ADMIN_FROM, to: email, ...adminRemovedEmail() });
    } catch {
      /* they're removed either way */
    }
  }
  refresh();
  return { ok: Date.now() };
}

// Accept an invitation: you must be signed in as the account with the invited email (the database checks).
export async function acceptInvite(token: string): Promise<AdminResult> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return failed("That invitation link isn't valid.");
  const { supabase } = await getCurrentUser();
  const { error } = await supabase.rpc("accept_admin_invite", { hash: sha256(token) });
  if (error) {
    return failed(inviteProblem(error.message));
  }
  return { ok: Date.now() }; // the page then loads "/" afresh: a redirect() here would render the app's home on this host
}

// Admin sign-in: an email address, or the username "superadmin". Returns to `next` (an invitation) when it's ours.
export type AdminSignInState = { error?: string; identifier?: string; go?: string };

export async function adminSignIn(_: AdminSignInState, formData: FormData): Promise<AdminSignInState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!identifier || !password) return { error: "Enter your email (or username) and password.", identifier };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: signInEmail(identifier), password });
  if (error) return { error: error.status === 429 ? "Too many tries. Give it a minute, then try again." : "That email and password don't match.", identifier };
  const next = String(formData.get("next") ?? "");
  // Not redirect(): inside an action it would render the app's page for "/" on this host. The form loads `go` afresh.
  return { go: inviteNext(next) ?? "/" };
}

// Google sign-in on the admin site. It signs in an existing account (a Google account with the same verified email is
// linked to the account that email already has, so an existing admin stays an admin). Being admin still comes only from
// the admins table, which only an invitation fills, so Google can't make anyone an admin. Where to return afterwards (an
// invitation) goes in a short-lived cookie rather than the URL, so the redirect address stays fixed.
export async function adminGoogleSignIn(next?: string): Promise<{ go?: string; error?: string }> {
  const origin = await adminOrigin();
  if (!isAdminOrigin(origin)) return { error: "Open the admin site to sign in." };
  const jar = await cookies();
  const target = inviteNext(next);
  if (target) jar.set(ADMIN_NEXT_COOKIE, target, { httpOnly: true, sameSite: "lax", path: "/auth", maxAge: 600, secure: origin.startsWith("https") });
  else jar.delete({ name: ADMIN_NEXT_COOKIE, path: "/auth" });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback` } });
  if (error || !data.url) return { error: "Couldn't start Google sign-in. Try again." };
  return { go: data.url };
}

export async function adminSignOut(): Promise<AdminResult> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: Date.now() };
}

// Your own account: display name and password.
export async function updateMyName(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const name = String(formData.get("display_name") ?? "").trim();
  if (name.length > 40) return failed("Keep it under 40 characters.");
  const { supabase, userId } = await getCurrentUser();
  if (!(await isAdmin(supabase))) notFound();
  const { error } = await supabase.from("profiles").update({ display_name: name || null }).eq("id", userId);
  if (error) return failed("Couldn't save your name. Try again.");
  refresh();
  return { ok: Date.now() };
}

export async function changePassword(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const password = passwordSchema.safeParse(String(formData.get("password") ?? ""));
  if (!password.success) return failed(password.error.issues[0].message);
  if (formData.get("password") !== formData.get("confirm")) return failed("The two passwords don't match.");
  const { supabase } = await getCurrentUser();
  if (!(await isAdmin(supabase))) notFound();
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    if (error.code === "same_password") return failed("That's your current password. Pick a new one.");
    if (error.code === "weak_password") return failed("Pick a stronger password: at least 8 characters.");
    if (error.code === "reauthentication_needed") return failed("Sign out and back in, then try again.");
    return failed("Couldn't change your password. Try again.");
  }
  refresh();
  return { ok: Date.now() };
}

// A battle between two live dishes. In one city when both are there, otherwise a city war shown everywhere.
export async function createBattle(_: AdminResult, formData: FormData): Promise<AdminResult> {
  const a = id.safeParse(formData.get("dish_a"));
  const b = id.safeParse(formData.get("dish_b"));
  const tag = String(formData.get("tag") ?? "").trim();
  if (!a.success || !b.success) return failed("Pick a dish for both sides.");
  if (a.data === b.data) return failed("Pick two different dishes.");
  if (tag.length < 3 || tag.length > 80) return failed("Give the battle a title of 3 to 80 characters.");
  const supabase = await admin();
  const { data: dishes } = await supabase.from("dishes").select("id, restaurant:restaurants(city)").in("id", [a.data, b.data]).returns<{ id: string; restaurant: { city: string } }[]>();
  const cities = new Set((dishes ?? []).map((d) => d.restaurant.city));
  const { error } = await supabase.rpc("admin_create_battle", { dish_a: a.data, dish_b: b.data, tag, city: cities.size === 1 ? [...cities][0] : null });
  if (error) return failed(error.message.includes("live") ? "Both dishes must be live." : "Couldn't create that battle. Try again.");
  refresh();
  return { ok: Date.now() };
}

// A menu sheet: an Excel file of restaurants and their dishes. Without `apply` it only checks the file and says what an
// import would do; with it, it imports (all of it or none of it). Whatever the sheet says is checked here and again by the
// database, and only admins get this far.
export type ImportState = { error?: string; problems?: MenuProblem[]; moreProblems?: number; counts?: ImportCounts; applied?: boolean };
const UPLOAD_MAX = 900 * 1024; // a server action takes a body of up to 1 MB

export async function importMenu(_: ImportState, formData: FormData): Promise<ImportState> {
  const supabase = await admin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an Excel file first." };
  if (!/\.xlsx$/i.test(file.name)) return { error: "That isn't an .xlsx file. In Excel, use Save As and pick Excel Workbook (.xlsx)." };
  if (file.size > UPLOAD_MAX) return { error: "That file is over 900 KB. Split it into smaller files." };

  let sheet: string[][];
  try {
    sheet = readFirstSheet(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    return { error: e instanceof SheetError ? e.message : "Couldn't read that file. Is it a real .xlsx?" };
  }
  const parsed = parseMenuSheet(sheet);
  if (parsed.fatal) return { error: parsed.fatal };
  if (parsed.problems.length) return { problems: parsed.problems.slice(0, 30), moreProblems: Math.max(0, parsed.problems.length - 30) };

  const apply = formData.get("apply") === "1";
  const { data, error } = await supabase.rpc("admin_import_menu", { sheet: parsed.rows.map((r) => ({ restaurant: r.restaurant, area: r.area, city: r.city, dish: r.dish, diet: r.diet, list: r.list, slug: r.slug, slug_alt: r.slug_alt })), apply });
  if (error) {
    return { error: error.message.includes("no free address") ? "One restaurant couldn't get a free web address. Change its name a little and try again." : "The import didn't go through and nothing was changed. Try again." };
  }
  if (apply) refresh();
  return { counts: data as ImportCounts, applied: apply };
}

export async function deleteBattle(battle: string): Promise<AdminResult> {
  if (!id.safeParse(battle).success) return failed("That battle isn't valid.");
  const supabase = await admin();
  const { error } = await supabase.rpc("admin_delete_battle", { battle });
  if (error) return failed("Couldn't delete that battle. Try again.");
  refresh();
  return { ok: Date.now() };
}

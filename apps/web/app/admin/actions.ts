"use server";

import { refresh } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { restaurantSchema, restaurantSlug } from "@/lib/validation";
import { asCity } from "@/lib/cities";

// Every admin action runs as the signed-in admin; the database functions check is_admin() again and log it.
// These only validate input, call the function, and clean up photo files the database can't delete.

export type AdminResult = { error?: string; ok?: number };

const id = z.uuid();
const target = z.enum(["rating", "comment", "dish"]);

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

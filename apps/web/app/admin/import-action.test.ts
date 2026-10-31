import { beforeEach, describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

// The upload action, with a stand-in database: who may run it, how it treats files, and exactly what it sends on.
const rpc = vi.fn();
const refresh = vi.fn();
const isAdmin = { value: true };
vi.mock("@/lib/auth", () => ({ getCurrentUser: async () => ({ supabase: { rpc }, userId: "admin-1", profile: { username: "boss" } }) }));
vi.mock("@/lib/admin", () => ({ isAdmin: async () => isAdmin.value }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/admin-email", () => ({ ADMIN_FROM: "x", adminInviteEmail: vi.fn(), adminRemovedEmail: vi.fn() }));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ set: vi.fn(), delete: vi.fn() }) }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: vi.fn(),
}));
const { importMenu } = await import("./actions");

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function sheet(rows: string[][]) {
  const body = rows.map((r, i) => `<row r="${i + 1}">${r.map((v, c) => (v ? `<c r="${String.fromCharCode(65 + c)}${i + 1}" t="inlineStr"><is><t>${esc(v)}</t></is></c>` : "")).join("")}</row>`).join("");
  return zipSync({ "xl/worksheets/sheet1.xml": strToU8(`<worksheet><sheetData>${body}</sheetData></worksheet>`) });
}
const H = ["Restaurant", "Area", "City", "Dish", "Diet", "List"];
const upload = (bytes: Uint8Array | string, name = "menu.xlsx", apply = false) => {
  const data = new FormData();
  data.set("file", new File([bytes as BlobPart], name));
  if (apply) data.set("apply", "1");
  return data;
};
const COUNTS = { restaurants_new: 1, restaurants_existing: 0, dishes_new: 1, dishes_existing: 0, unknown_lists: [] };

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ data: COUNTS, error: null });
  refresh.mockReset();
  isAdmin.value = true;
});

describe("importMenu", () => {
  const good = sheet([H, ["CTR", "Malleshwaram", "Bengaluru", "Benne Masala Dosa", "Veg", "Dosa"]]);

  it("is for admins only, and touches nothing otherwise", async () => {
    isAdmin.value = false;
    await expect(importMenu({}, upload(good))).rejects.toThrow("NOT_FOUND");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("checks the file before reading it", async () => {
    expect((await importMenu({}, new FormData())).error).toMatch(/Choose an Excel file/);
    expect((await importMenu({}, upload(good, "menu.csv"))).error).toMatch(/\.xlsx/);
    expect((await importMenu({}, upload(new Uint8Array(901 * 1024), "big.xlsx"))).error).toMatch(/over 900 KB/);
    expect((await importMenu({}, upload("not a workbook", "fake.xlsx"))).error).toMatch(/isn't an Excel/);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("lists the rows to fix and imports nothing while there are any", async () => {
    const bad = sheet([H, ["A", "B", "Pune", "Dish", "Veg", ""], ...Array.from({ length: 40 }, () => ["C", "D", "Delhi", "Dish", "Maybe", ""])]);
    const out = await importMenu({}, upload(bad, "menu.xlsx", true));
    expect(out.problems).toHaveLength(30);
    expect(out.moreProblems).toBe(11);
    expect(out.problems?.[0]).toMatchObject({ line: 2 });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("previews without changing anything, sending only what the database needs", async () => {
    const out = await importMenu({}, upload(good));
    expect(out).toEqual({ counts: COUNTS, applied: false });
    expect(rpc).toHaveBeenCalledWith("admin_import_menu", {
      sheet: [{ restaurant: "CTR", area: "Malleshwaram", city: "Bengaluru", dish: "Benne Masala Dosa", diet: "veg", list: "Dosa", slug: "ctr", slug_alt: "ctr-malleshwaram" }],
      apply: false,
    });
    expect(refresh).not.toHaveBeenCalled();
  });

  it("imports when told to, and refreshes the page", async () => {
    const out = await importMenu({}, upload(good, "menu.xlsx", true));
    expect(out.applied).toBe(true);
    expect(rpc.mock.calls[0][1].apply).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("says nothing was changed when the database says no", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const out = await importMenu({}, upload(good, "menu.xlsx", true));
    expect(out.error).toMatch(/nothing was changed/);
    expect(refresh).not.toHaveBeenCalled();
  });
});

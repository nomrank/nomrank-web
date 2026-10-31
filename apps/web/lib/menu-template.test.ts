import { describe, expect, it } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import { MENU_HEADERS, parseMenuSheet } from "./menu-import";
import { buildMenuTemplate } from "./menu-template";
import { readFirstSheet } from "./xlsx-read";

describe("buildMenuTemplate", () => {
  const bytes = buildMenuTemplate();

  it("opens with exactly the headings the importer reads, and nothing under them", () => {
    expect(readFirstSheet(bytes)).toEqual([[...MENU_HEADERS]]);
    // uploaded untouched, it says there's nothing to import rather than creating anything
    expect(parseMenuSheet(readFirstSheet(bytes)).fatal).toMatch(/nothing under the headings/);
  });

  it("is a complete workbook: every part Excel needs is there, and every XML part is well formed", () => {
    const files = unzipSync(bytes);
    expect(Object.keys(files).sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]);
    for (const [name, data] of Object.entries(files)) {
      const stack: string[] = [];
      for (const m of strFromU8(data).matchAll(/<(\/?)([A-Za-z][\w:]*)([^>]*?)(\/?)>/g)) {
        if (m[4]) continue; // <x/>
        if (m[1]) expect(stack.pop(), name).toBe(m[2]);
        else stack.push(m[2]);
      }
      expect(stack, `${name} has unclosed tags`).toEqual([]);
    }
  });

  it("puts City and Diet in as dropdowns for the 1000 lines an import can hold", () => {
    const sheet = strFromU8(unzipSync(bytes)["xl/worksheets/sheet1.xml"]);
    expect(sheet).toContain('sqref="C2:C1001"');
    expect(sheet).toContain('sqref="E2:E1001"');
    expect(sheet).toContain("Bengaluru,Mumbai,Delhi,Hyderabad");
  });

  it("has worked examples that the importer accepts, on the second sheet", () => {
    const help = strFromU8(unzipSync(bytes)["xl/worksheets/sheet2.xml"]);
    const rows = [...help.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) => [...r[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]));
    const at = rows.findIndex((r) => r[0] === "Restaurant");
    const parsed = parseMenuSheet(rows.slice(at).map((r) => [...r, ...Array(6).fill("")].slice(0, 6)));
    expect(parsed.problems).toEqual([]);
    expect(parsed.rows.length).toBe(4);
  });
});

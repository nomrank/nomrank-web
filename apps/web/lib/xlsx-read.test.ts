import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { MAX_ENTRY, MAX_ROWS, readFirstSheet, SheetError } from "./xlsx-read";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const col = (i: number) => String.fromCharCode(65 + i);

// A real .xlsx: strings stored the way Excel does (shared) or inline, in the sheet file named by `sheet`.
function xlsx(rows: (string | number | null)[][], { shared = true, sheet = "sheet1", extra = {} }: { shared?: boolean; sheet?: string; extra?: Record<string, Uint8Array> } = {}) {
  const strings: string[] = [];
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((v, c) => {
          const ref = `${col(c)}${r + 1}`;
          if (v === null) return "";
          if (typeof v === "number") return `<c r="${ref}"><v>${v}</v></c>`;
          if (!shared) return `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
          strings.push(v);
          return `<c r="${ref}" t="s"><v>${strings.length - 1}</v></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return zipSync({
    "[Content_Types].xml": strToU8("<Types/>"),
    [`xl/worksheets/${sheet}.xml`]: strToU8(`<worksheet><sheetData>${body}</sheetData></worksheet>`),
    ...(shared ? { "xl/sharedStrings.xml": strToU8(`<sst>${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join("")}</sst>`) } : {}),
    ...extra,
  });
}

describe("readFirstSheet", () => {
  it("reads shared strings and numbers", () => {
    expect(readFirstSheet(xlsx([["Restaurant", "Dish"], ["Paradise", "Biryani"], ["Cafe", 42]]))).toEqual([["Restaurant", "Dish"], ["Paradise", "Biryani"], ["Cafe", "42"]]);
  });
  it("reads inline strings too (Google Sheets and some exporters)", () => {
    expect(readFirstSheet(xlsx([["a", "b"]], { shared: false }))).toEqual([["a", "b"]]);
  });
  it("keeps empty cells in place, so a gap doesn't shift the columns", () => {
    expect(readFirstSheet(xlsx([["Paradise", null, "Biryani"], [null, "x"]]))).toEqual([["Paradise", "", "Biryani"], ["", "x"]]);
  });
  it("decodes &, <, accents and quotes", () => {
    const rows = readFirstSheet(xlsx([["Pizza & Co <1>", "Café", `"Special"`]]));
    expect(rows).toEqual([["Pizza & Co <1>", "Café", `"Special"`]]);
  });
  it("joins a string that Excel split into formatted runs, and decodes numeric entities", () => {
    const bytes = zipSync({
      "xl/worksheets/sheet1.xml": strToU8(`<sheetData><row><c r="A1" t="s"><v>0</v></c></row></sheetData>`),
      "xl/sharedStrings.xml": strToU8(`<sst><si><r><t>Mutton </t></r><r><t xml:space="preserve">Biryani &#233;&#x41;</t></r></si></sst>`),
    });
    expect(readFirstSheet(bytes)).toEqual([["Mutton Biryani éA"]]);
  });
  it("reads the lowest-numbered sheet when there are several", () => {
    const second = strToU8(`<sheetData><row><c r="A1" t="inlineStr"><is><t>second</t></is></c></row></sheetData>`);
    expect(readFirstSheet(xlsx([["first"]], { shared: false, sheet: "sheet1", extra: { "xl/worksheets/sheet2.xml": second } }))).toEqual([["first"]]);
    expect(readFirstSheet(xlsx([["ten"]], { shared: false, sheet: "sheet10", extra: { "xl/worksheets/sheet2.xml": second } }))).toEqual([["second"]]);
  });
  it("says so when the file isn't a workbook", () => {
    expect(() => readFirstSheet(strToU8("just some text"))).toThrow(SheetError);
    expect(() => readFirstSheet(zipSync({ "readme.txt": strToU8("hi") }))).toThrow(SheetError);
  });
  it("stops at the row limit", () => {
    const rows = Array.from({ length: MAX_ROWS + 1 }, (_, i) => [`r${i}`]);
    expect(() => readFirstSheet(xlsx(rows, { shared: false }))).toThrow(/more than/);
    expect(readFirstSheet(xlsx(rows.slice(0, MAX_ROWS), { shared: false }))).toHaveLength(MAX_ROWS);
  });
  it("refuses a zip bomb without unpacking it", () => {
    const huge = new Uint8Array(MAX_ENTRY + 1024); // zeros: tiny once compressed
    const bomb = zipSync({ "xl/worksheets/sheet1.xml": huge });
    expect(bomb.length).toBeLessThan(100_000);
    expect(() => readFirstSheet(bomb)).toThrow(SheetError);
  });
});

import { strFromU8, unzipSync } from "fflate";

// Reads the first sheet of an .xlsx file as rows of text. An .xlsx is a zip of XML files, and this reads only the two it
// needs (the first sheet and the shared strings), so it stays small and has nothing to trust but fflate.
//
// Built for an admin's upload, so it's strict about size: an entry that would unpack past MAX_ENTRY is never opened (a "zip
// bomb" is a tiny file that unpacks to gigabytes), and the sheet is cut off at MAX_ROWS rows and MAX_COLS columns.
// shortcut: first sheet only, values as shown text (a date cell comes back as its serial number). Fine for a menu list.

export const MAX_ENTRY = 20 * 1024 * 1024;
export const MAX_ROWS = 1500;
export const MAX_COLS = 30;

export class SheetError extends Error {}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    if (e[0] !== "#") return ENTITIES[e.toLowerCase()];
    const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
  });

// All the text in a piece of XML: every <t>…</t> joined (a string can be split into several runs by formatting).
const text = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join("");

// "AB" → 27 (zero-based column index).
const column = (letters: string) => [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

export function readFirstSheet(bytes: Uint8Array): string[][] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      // Look at the sizes before unpacking anything, and only unpack what's needed.
      filter: (f) => f.originalSize <= MAX_ENTRY && (f.name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(f.name)),
    });
  } catch {
    throw new SheetError("That file isn't an Excel (.xlsx) workbook.");
  }
  const sheetName = Object.keys(files)
    .filter((n) => n.startsWith("xl/worksheets/"))
    .sort((a, b) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10))[0];
  if (!sheetName) throw new SheetError("Couldn't find a sheet in that file. Is it too big, or not an .xlsx?");

  const shared = files["xl/sharedStrings.xml"] ? [...strFromU8(files["xl/sharedStrings.xml"]).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((m) => text(m[1])) : [];
  const xml = strFromU8(files[sheetName]);

  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
    if (rows.length >= MAX_ROWS) throw new SheetError(`That sheet has more than ${MAX_ROWS} rows. Split it into smaller files.`);
    const cells: string[] = [];
    let next = 0;
    for (const c of rowMatch[1].matchAll(/<c((?:\s[^>]*?)?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1] ?? "";
      const at = attrs.match(/\sr="([A-Z]+)\d+"/);
      const index = at ? column(at[1]) : next;
      next = index + 1;
      if (index >= MAX_COLS) continue;
      const type = attrs.match(/\st="(\w+)"/)?.[1];
      const body = c[2] ?? "";
      let value = "";
      if (type === "s") value = shared[parseInt(body.match(/<v>(\d+)<\/v>/)?.[1] ?? "-1", 10)] ?? "";
      else if (type === "inlineStr") value = text(body);
      else value = decode(body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
      while (cells.length < index) cells.push("");
      cells[index] = value;
    }
    rows.push(cells);
  }
  return rows;
}

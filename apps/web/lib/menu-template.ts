import { strToU8, zipSync } from "fflate";
import { CITIES } from "./cities";
import { MENU_HEADERS } from "./menu-import";

// The blank sheet an admin fills in and uploads: a "Menu" sheet with just the headings (City and Diet are dropdowns), and a
// second sheet of instructions with a few worked rows. The examples are on that second sheet so uploading the template
// untouched can't create anything. Built here from the same headings the importer reads, so the two can't drift apart.

const NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cell = (ref: string, text: string, style = 0) => `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${esc(text)}</t></is></c>`;
const letter = (i: number) => String.fromCharCode(65 + i);

const WIDTHS = [32, 22, 14, 34, 12, 18];
const LAST_ROW = 1001; // the dropdowns cover the 1000 rows an import can hold

const HELP: string[][] = [
  ["How to fill in the Menu sheet"],
  [""],
  ["One line per dish. Put a restaurant on several lines to give it several dishes."],
  ["Restaurant, Area and City are needed on every line. City is one of: " + CITIES.join(", ") + "."],
  ["Dish and Diet go together. Diet is Veg, Non-veg, Egg or Vegan. Leave both empty to add just the restaurant."],
  ["List is optional: the food list the dish belongs in, for example Biryani or Dosa. Leave it empty and the dish is placed by its name."],
  ["A restaurant or dish that's already on Nomrank is left alone, so it's safe to upload a sheet twice."],
  ["Up to 1000 lines per file."],
  [""],
  [...MENU_HEADERS],
  ["Paradise", "Secunderabad", "Hyderabad", "Chicken Dum Biryani", "Non-veg", "Biryani"],
  ["Paradise", "Secunderabad", "Hyderabad", "Veg Biryani", "Veg", "Biryani"],
  ["CTR", "Malleshwaram", "Bengaluru", "Benne Masala Dosa", "Veg", "Dosa"],
  ["Karim's", "Jama Masjid", "Delhi", "", "", ""],
];

export function buildMenuTemplate(): Uint8Array {
  const header = MENU_HEADERS.map((h, i) => cell(`${letter(i)}1`, h, 1)).join("");
  const cols = WIDTHS.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
  const dropdown = (col: string, items: readonly string[]) =>
    `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Pick from the list" error="Choose one of: ${esc(items.join(", "))}" sqref="${col}2:${col}${LAST_ROW}"><formula1>"${esc(items.join(","))}"</formula1></dataValidation>`;
  const menu = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet ${NS}><sheetViews><sheetView workbookViewId="0" tabSelected="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData><row r="1">${header}</row></sheetData><dataValidations count="2">${dropdown("C", CITIES)}${dropdown("E", ["Veg", "Non-veg", "Egg", "Vegan"])}</dataValidations></worksheet>`;

  const help = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet ${NS}><cols><col min="1" max="6" width="26" customWidth="1"/></cols><sheetData>${HELP.map(
    (row, r) => `<row r="${r + 1}">${row.map((v, c) => (v ? cell(`${letter(c)}${r + 1}`, v, r === 0 || r === 9 ? 1 : 0) : "")).join("")}</row>`,
  ).join("")}</sheetData></worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet ${NS}><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  return zipSync({
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook ${NS} xmlns:r="${REL}"><sheets><sheet name="Menu" sheetId="1" r:id="rId1"/><sheet name="How to fill this in" sheetId="2" r:id="rId2"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
    ),
    "xl/styles.xml": strToU8(styles),
    "xl/worksheets/sheet1.xml": strToU8(menu),
    "xl/worksheets/sheet2.xml": strToU8(help),
  });
}

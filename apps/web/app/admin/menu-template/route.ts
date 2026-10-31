import { buildMenuTemplate } from "@/lib/menu-template";

// The blank sheet for importing menus (the admin site serves it at /menu-template).
export function GET() {
  return new Response(Buffer.from(buildMenuTemplate()), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="nomrank-menu-template.xlsx"',
    },
  });
}

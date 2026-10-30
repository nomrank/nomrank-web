import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteFooter } from "./site-footer";

const hrefs = (html: string) => [...html.matchAll(/<nav[\s\S]*?<\/nav>/g)].join("").match(/href="[^"]+"/g);

describe("SiteFooter", () => {
  afterEach(() => {
    delete process.env.COMING_SOON;
  });

  it("before launch links only to the pages that are open", () => {
    process.env.COMING_SOON = "1";
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(hrefs(html)).toEqual(['href="/"', 'href="/about"', 'href="/about#rankings"', 'href="/about#guidelines"', 'href="/terms"', 'href="/privacy"', 'href="/credits"']);
    expect(html).toContain("© 2026 Nomrank. All rights reserved.");
  });

  it("after launch shows the app's links", () => {
    const html = renderToStaticMarkup(<SiteFooter />);
    expect(hrefs(html)).toContain('href="/settings"');
    expect(hrefs(html)).toContain('href="/battles"');
  });
});

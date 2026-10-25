import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/lib/supabase/proxy", () => ({ updateSession: async () => NextResponse.next() }));
const { proxy } = await import("./proxy");

const get = (url: string) => proxy(new NextRequest(url));

describe("proxy before launch", () => {
  afterEach(() => {
    delete process.env.COMING_SOON;
  });

  it("closes the app on the main domain but not on beta, which stays out of search", async () => {
    process.env.COMING_SOON = "1";
    expect((await get("https://www.nomrank.in/rate")).headers.get("location")).toBe("https://www.nomrank.in/");
    expect((await get("https://www.nomrank.in/")).headers.get("x-middleware-rewrite")).toBe("https://www.nomrank.in/coming-soon");

    const beta = await get("https://beta.nomrank.in/rate");
    expect(beta.headers.get("location")).toBeNull();
    expect(beta.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("leaves the main domain indexable once launched", async () => {
    expect((await get("https://www.nomrank.in/rate")).headers.get("x-robots-tag")).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const exchange = vi.fn();
const rpc = vi.fn();
const signOut = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: exchange, signOut }, rpc }) }));

const jar = { value: undefined as string | undefined, deleted: [] as unknown[] };
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (jar.value ? { value: jar.value } : undefined), delete: (c: unknown) => jar.deleted.push(c) }),
}));
const { GET } = await import("./route");

const TOKEN = "t".repeat(43);
const hit = async (host: string, query: string) => {
  const proto = host.startsWith("admin.localhost") ? "http" : "https";
  const res = await GET(new NextRequest(`${proto}://${host}/auth/callback?${query}`, { headers: { host } }));
  return res.headers.get("location");
};

beforeEach(() => {
  exchange.mockReset().mockResolvedValue({ error: null });
  rpc.mockReset().mockResolvedValue({ data: { admin: false } });
  signOut.mockReset().mockResolvedValue({});
  jar.value = undefined;
  jar.deleted = [];
});

describe("GET /auth/callback on the app", () => {
  it("signs in with the code and lets / route onward", async () => {
    expect(await hit("beta.nomrank.in", "code=abc")).toBe("https://beta.nomrank.in/");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("explains a cancelled Google sign-in, and an unusable code", async () => {
    expect(await hit("beta.nomrank.in", "error=access_denied")).toBe("https://beta.nomrank.in/login?error=google");
    exchange.mockResolvedValue({ error: new Error("bad code") });
    expect(await hit("beta.nomrank.in", "code=abc")).toBe("https://beta.nomrank.in/login?error=link");
    expect(await hit("beta.nomrank.in", "")).toBe("https://beta.nomrank.in/login?error=link");
  });
});

describe("GET /auth/callback on the admin site", () => {
  it("sends an admin to the dashboard, even when an invitation was open", async () => {
    rpc.mockResolvedValue({ data: { admin: true } });
    jar.value = `/invite/${TOKEN}`;
    expect(await hit("admin.nomrank.in", "code=abc")).toBe("https://admin.nomrank.in/");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("sends an invitee back to their invitation", async () => {
    jar.value = `/invite/${TOKEN}`;
    expect(await hit("admin.nomrank.in", "code=abc")).toBe(`https://admin.nomrank.in/invite/${TOKEN}`);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out anyone who is neither an admin nor invited, so Google can't be a way in", async () => {
    expect(await hit("admin.nomrank.in", "code=abc")).toBe("https://admin.nomrank.in/login?error=not-admin");
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("never follows a destination that isn't an invitation link", async () => {
    for (const bad of ["https://evil.example", "//evil.example", "/", "/admin?tab=people", "/invite/short", `/invite/${TOKEN}/../x`]) {
      jar.value = bad;
      expect(await hit("admin.nomrank.in", "code=abc")).toBe("https://admin.nomrank.in/login?error=not-admin");
    }
  });

  it("clears the stored destination after use", async () => {
    jar.value = `/invite/${TOKEN}`;
    await hit("admin.nomrank.in", "code=abc");
    expect(jar.deleted).toEqual([{ name: "admin_next", path: "/auth" }]);
  });

  it("stays on the admin host when Google fails, in development too", async () => {
    expect(await hit("admin.localhost:3000", "error=access_denied")).toBe("http://admin.localhost:3000/login?error=google");
    exchange.mockResolvedValue({ error: new Error("x") });
    expect(await hit("admin.localhost:3000", "code=abc")).toBe("http://admin.localhost:3000/login?error=link");
  });

  it("doesn't treat a lookalike host as the admin site", async () => {
    expect(await hit("admin.nomrank.in.evil.example", "code=abc")).toBe("https://admin.nomrank.in.evil.example/");
    expect(rpc).not.toHaveBeenCalled();
  });
});

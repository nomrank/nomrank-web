import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const verifyOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { verifyOtp } }) }));
const { GET } = await import("./route");

const hit = async (query: string) => (await GET(new NextRequest(`https://beta.nomrank.in/auth/confirm?${query}`))).headers.get("location");

describe("GET /auth/confirm", () => {
  beforeEach(() => verifyOtp.mockReset().mockResolvedValue({ error: null }));

  it("signs in from the token in the link, whatever browser opens it", async () => {
    expect(await hit("token_hash=abc&type=email")).toBe("https://beta.nomrank.in/");
    expect(verifyOtp).toHaveBeenCalledWith({ type: "email", token_hash: "abc" });
  });

  it("sends a recovery link to the new password page", async () => {
    expect(await hit("token_hash=abc&type=recovery")).toBe("https://beta.nomrank.in/reset-password");
  });

  it("sends an expired or used token to the sign-in screen", async () => {
    verifyOtp.mockResolvedValue({ error: new Error("expired") });
    expect(await hit("token_hash=abc&type=email")).toBe("https://beta.nomrank.in/login?error=link");
  });

  it("ignores a missing token, an unknown type, and any redirect in the URL", async () => {
    expect(await hit("type=email")).toBe("https://beta.nomrank.in/login?error=link");
    expect(await hit("token_hash=abc&type=magiclink")).toBe("https://beta.nomrank.in/login?error=link");
    expect(await hit("token_hash=abc&type=email&next=https://evil.example")).toBe("https://beta.nomrank.in/");
    expect(verifyOtp).toHaveBeenCalledTimes(1);
  });
});

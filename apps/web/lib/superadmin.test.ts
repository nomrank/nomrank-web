import { describe, expect, it } from "vitest";
import { inviteProblem, inviteUrl, isAdminOrigin, signInEmail, SUPERADMIN_EMAIL } from "./superadmin";

describe("inviteProblem", () => {
  it("says what actually went wrong, so a missing profile is never reported as an expired link", () => {
    expect(inviteProblem("finish setting up your account first")).toMatch(/setting up/i);
    expect(inviteProblem("invitation expired")).toMatch(/expired/i);
    expect(inviteProblem("invitation already used")).toMatch(/already used/i);
    expect(inviteProblem("invitation not found")).toMatch(/isn't valid/i);
    expect(inviteProblem("invitation is for another email")).toMatch(/different email/i);
    expect(inviteProblem("confirm your email first")).toMatch(/confirm/i);
    expect(inviteProblem("a banned account can't be an admin")).toMatch(/can't be an admin/i);
  });

  it("never calls an unknown failure an expired link", () => {
    expect(inviteProblem("insert or update on table violates foreign key constraint")).not.toMatch(/expired/i);
  });
});

describe("isAdminOrigin", () => {
  it("accepts only the admin site's own addresses", () => {
    expect(isAdminOrigin("https://admin.nomrank.in")).toBe(true);
    expect(isAdminOrigin("http://admin.localhost:3000")).toBe(true);
    expect(isAdminOrigin("https://www.nomrank.in")).toBe(false);
    expect(isAdminOrigin("https://admin.nomrank.in.evil.example")).toBe(false);
    expect(isAdminOrigin("https://admin.evil.example")).toBe(false);
    expect(isAdminOrigin("http://admin.nomrank.in")).toBe(false);
    expect(isAdminOrigin("https://admin.nomrank.in@evil.example")).toBe(false);
    expect(isAdminOrigin("https://evil.example/admin.nomrank.in")).toBe(false);
    expect(isAdminOrigin("javascript:alert(1)")).toBe(false);
    expect(isAdminOrigin("")).toBe(false);
  });
});

describe("inviteUrl / signInEmail", () => {
  it("builds the link on the admin origin", () => {
    expect(inviteUrl("https://admin.nomrank.in", "abc")).toBe("https://admin.nomrank.in/invite/abc");
  });
  it('maps the username "superadmin" to its reserved address', () => {
    expect(signInEmail(" SuperAdmin ")).toBe(SUPERADMIN_EMAIL);
    expect(signInEmail("a@b.co")).toBe("a@b.co");
  });
});

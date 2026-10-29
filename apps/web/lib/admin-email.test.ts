import { describe, expect, it } from "vitest";
import { ADMIN_FROM, adminInviteEmail, adminRemovedEmail } from "./admin-email";
import { inviteUrl, signInEmail, SUPERADMIN_EMAIL } from "./superadmin";

describe("adminInviteEmail", () => {
  it("carries the link and escapes the inviter's name", () => {
    const { html, text, subject } = adminInviteEmail({ url: "https://admin.nomrank.in/invite/abc", inviter: "<b>Eve</b>" });
    expect(subject).toMatch(/invited/);
    expect(html).toContain('href="https://admin.nomrank.in/invite/abc"');
    expect(html).not.toContain("<b>Eve</b>");
    expect(html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
    expect(text).toContain("https://admin.nomrank.in/invite/abc");
  });
});

describe("sender", () => {
  it("admin emails come from admin-alerts@nomrank.in", () => {
    expect(ADMIN_FROM).toContain("<admin-alerts@nomrank.in>");
  });
});

describe("adminRemovedEmail", () => {
  it("says access was removed and has no link to click", () => {
    const { html, subject } = adminRemovedEmail();
    expect(subject).toMatch(/no longer/);
    expect(html).not.toContain("<a ");
  });
});

describe("superadmin sign-in", () => {
  it("maps the username onto its reserved address and leaves emails alone", () => {
    expect(signInEmail(" SuperAdmin ")).toBe(SUPERADMIN_EMAIL);
    expect(signInEmail("ann@example.com")).toBe("ann@example.com");
  });
  it("builds the invitation link", () => {
    expect(inviteUrl("https://admin.nomrank.in", "tok")).toBe("https://admin.nomrank.in/invite/tok");
  });
});

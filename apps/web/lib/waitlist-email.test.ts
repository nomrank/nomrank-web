import { describe, expect, it } from "vitest";
import { waitlistEmail } from "./waitlist-email";

describe("waitlistEmail", () => {
  it("has a subject, a link to the site, and a matching plain-text version", () => {
    const { subject, html, text } = waitlistEmail("https://www.nomrank.in/");
    expect(subject).toBe("You're on the Nomrank waitlist");
    expect(html).toContain('href="https://www.nomrank.in"');
    expect(html).toContain("Visit nomrank.in");
    expect(text).toContain("You're on the list.");
    expect(text).toContain("Bengaluru, Mumbai, Delhi and Hyderabad");
    expect(text).toContain("https://www.nomrank.in");
    expect(html).toContain('src="https://www.nomrank.in/email/must-try-10.png"');
    expect(html).not.toContain("undefined");
  });
});

// Sending email through Resend's HTTP API (no SDK needed). Server only: it reads RESEND_API_KEY, a secret that lives in
// Vercel's environment variables and apps/web/.env.local, never in the browser or the repo.

const FROM = "Nomrank <hello@nomrank.in>";

// `from` overrides the sender, e.g. the admin site sends as admin@nomrank.in (any address on the verified domain works).
type Email = { to: string; subject: string; html: string; text: string; from?: string };

// Sends one email. Without RESEND_API_KEY (e.g. local development) it does nothing and says so.
export async function sendEmail({ to, subject, html, text, from = FROM }: Email) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set; not sending "${subject}"`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

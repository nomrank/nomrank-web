// The two emails the admin site sends: an invitation to become an admin, and a note when someone is removed.
// Same look as the other Nomrank emails: plum card, ketchup button, inline styles, table layout.

const STUDIO = "#17111c";
const PAPER = "#211a27";
const HAIRLINE = "#2f2737";
const SPOTLIGHT = "#fff4ea";
const MUTED = "#b3a8b9";
const FAINT = "#8e8296";
const KETCHUP = "#ff4b3a";
const MUSTARD = "#ffc23c";
const FONT = "Geist, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const HEAD = "Urbanist, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MARK = "'Plus Jakarta Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// Admin emails come from this address (it needs the nomrank.in domain verified in Resend, as hello@ already is).
export const ADMIN_FROM = "Nomrank Admin <admin@nomrank.in>";
const SITE = "https://www.nomrank.in"; // the logo image is the app icon, served from here even before launch

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout({ title, body, button, note }: { title: string; body: string; button?: { label: string; url: string }; note: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${STUDIO};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${STUDIO}" style="background:${STUDIO};"><tr><td align="center" style="padding:32px 12px 48px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
<tr><td style="padding:0 8px 24px 8px;font-family:${MARK};font-size:26px;line-height:30px;font-weight:800;letter-spacing:-0.9px;color:${SPOTLIGHT};"><img src="${SITE}/apple-icon" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;width:40px;height:40px;border:0;border-radius:10px;margin-right:12px;">nomrank <span style="font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0;color:${MUSTARD};border:1px solid ${MUSTARD};border-radius:999px;padding:2px 8px;vertical-align:middle;">Admin</span></td></tr>
<tr><td style="padding:0 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td bgcolor="${PAPER}" style="background:${PAPER};border:1px solid ${HAIRLINE};border-radius:28px;padding:36px 32px;">
<h1 style="margin:0;font-family:${HEAD};font-size:30px;line-height:34px;font-weight:900;letter-spacing:-1px;color:${SPOTLIGHT};">${esc(title)}</h1>
<p style="margin:16px 0 0 0;font-family:${FONT};font-size:16px;line-height:25px;color:${MUTED};">${body}</p>
${
  button
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td align="center" bgcolor="${KETCHUP}" style="background:${KETCHUP};border-radius:999px;"><a href="${esc(button.url)}" style="display:block;padding:16px 24px;font-family:${FONT};font-size:16px;line-height:22px;font-weight:700;color:${STUDIO};text-decoration:none;">${esc(button.label)}&nbsp;&nbsp;&rarr;</a></td></tr></table>
<p style="margin:20px 0 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${FAINT};">Button not working? Paste this link into your browser:<br><a href="${esc(button.url)}" style="color:${MUTED};word-break:break-all;">${esc(button.url)}</a></p>`
    : ""
}
</td></tr></table></td></tr>
<tr><td style="padding:24px 8px 0 8px;font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};">${note}</td></tr>
</table></td></tr></table></body></html>`;
}

export function adminInviteEmail({ url, inviter }: { url: string; inviter: string }) {
  return {
    subject: "You're invited to be a Nomrank admin",
    html: layout({
      title: "Be a Nomrank admin",
      body: `${esc(inviter)} invited you to help run Nomrank: review dishes, handle reports, and look after the places and people on it. Sign in with the Nomrank account for this email address, then accept.`,
      button: { label: "Accept the invitation", url },
      note: "The link works for 7 days and only for this email address. Not expecting this? Ignore this email and nothing changes.",
    }),
    text: `${inviter} invited you to be a Nomrank admin.\n\nSign in with the Nomrank account for this email address, then accept:\n${url}\n\nThe link works for 7 days and only for this email address. Not expecting this? Ignore this email and nothing changes.`,
  };
}

export function adminRemovedEmail() {
  return {
    subject: "You're no longer a Nomrank admin",
    html: layout({
      title: "Admin access removed",
      body: "Your admin access to Nomrank has been removed, so you can no longer sign in to the admin site. Your normal Nomrank account is untouched.",
      note: "Think this was a mistake? Reply to this email or ask the person who runs Nomrank.",
    }),
    text: "Your admin access to Nomrank has been removed, so you can no longer sign in to the admin site. Your normal Nomrank account is untouched.\n\nThink this was a mistake? Reply to this email or ask the person who runs Nomrank.",
  };
}

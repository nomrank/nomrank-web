// The "you're on the waitlist" email, in the app's dark look. Built the way email clients need it: tables, inline
// styles, bgcolor attributes for Outlook. Urbanist and Geist load where the client allows web fonts (Apple Mail, iOS);
// elsewhere they fall back to bold system faces. The layout is a menu: the product's three ideas as dishes with dotted
// leaders, under the app's "Must try" 10/10 sticker. The sticker is a PNG (public/email/must-try-10.png) because email
// clients drop SVG, masks and transforms; its alt text keeps a mustard "10/10" when images are blocked.
// It declares light and dark support so Apple Mail shows it as designed instead of auto-darkening it.

const STUDIO = "#17111c"; // page
const PAPER = "#211a27"; // raised surface
const HAIRLINE = "#2f2737";
const SPOTLIGHT = "#fff4ea"; // text: 16.7:1 on studio
const MUTED = "#b3a8b9"; // secondary text: 8.3:1 on studio, 7.6:1 on paper
const FAINT = "#8e8296"; // fine print: 5.2:1 on studio
const KETCHUP = "#ff4b3a";
const MUSTARD = "#ffc23c";
const DISPLAY = "Urbanist, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const WORDMARK = "'Plus Jakarta Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif"; // the wordmark face
const BODY = "Geist, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// The menu: what Nomrank does, with the "price" column naming what you get.
const MENU = [
  { dish: "Score every dish", note: "Score a plate from 1 to 10 and add a short take.", tag: "1 to 10" },
  { dish: "Rankings for every food", note: "Top Dosa, Top Biryani and more, ranked by the people who ate them.", tag: "Top spot" },
  { dish: "Tastes like home", note: "How people from a dish's home region rate it.", tag: "From home" },
];

export function waitlistEmail(siteUrl: string) {
  const site = siteUrl.replace(/\/$/, "");
  const host = site.replace(/^https?:\/\//, "").replace(/^www\./, ""); // shown, not linked: shorter fits the button on phones
  const subject = "You're on the Nomrank waitlist";

  const menu = MENU.map(
    ({ dish, note, tag }, i) => `
              <tr>
                <td style="padding:${i ? 24 : 0}px 0 0 0;${i ? `border-top:1px solid ${HAIRLINE};` : ""}">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td class="dish" style="font-family:${DISPLAY};font-size:20px;line-height:24px;font-weight:800;letter-spacing:-0.3px;color:${SPOTLIGHT};white-space:nowrap;padding-right:12px;">${dish}</td>
                      <td class="leader" width="100%" style="border-bottom:2px dotted ${KETCHUP};line-height:1px;font-size:1px;">&nbsp;</td>
                      <td style="padding-left:12px;white-space:nowrap;">
                        <span style="display:inline-block;background:${KETCHUP};color:${STUDIO};font-family:${BODY};font-size:12px;line-height:16px;font-weight:700;padding:5px 11px;border-radius:999px;">${tag}</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:8px 0 ${i === MENU.length - 1 ? 0 : 24}px 0;font-family:${BODY};font-size:15px;line-height:23px;color:${MUTED};">${note}</p>
                </td>
              </tr>`,
  ).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${subject}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=Urbanist:wght@800;900&family=Plus+Jakarta+Sans:wght@800&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (max-width: 520px) {
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .hero { padding: 24px 20px 32px 20px !important; }
    .hero-title { font-size: 36px !important; line-height: 39px !important; }
    .dish { white-space: normal !important; }
    .leader { display: none !important; }
    .menu-pad { padding: 24px 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${STUDIO};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${STUDIO};">We'll email you once more, on the day Nomrank opens.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${STUDIO}" style="background:${STUDIO};">
  <tr>
    <td align="center" style="padding:32px 12px 48px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr>
          <td class="pad" style="padding:0 8px 24px 8px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td valign="middle" style="padding-right:12px;"><img src="${site}/apple-icon" width="40" height="40" alt="" style="display:block;width:40px;height:40px;border:0;border-radius:10px;"></td>
              <td valign="middle" style="font-family:${WORDMARK};font-size:26px;line-height:30px;font-weight:800;letter-spacing:-0.9px;color:${SPOTLIGHT};">nomrank</td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:0 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="hero" align="center" bgcolor="${PAPER}" style="background:${PAPER};border:1px solid ${HAIRLINE};border-radius:28px;padding:32px 36px 40px 36px;">
                  <img src="${site}/email/must-try-10.png" width="184" height="184" alt="10/10" style="display:block;margin:0 auto;width:184px;height:184px;border:0;outline:none;font-family:${DISPLAY};font-size:48px;line-height:184px;font-weight:900;color:${MUSTARD};text-align:center;">
                  <h1 class="hero-title" style="margin:16px 0 0 0;font-family:${DISPLAY};font-size:44px;line-height:46px;font-weight:900;letter-spacing:-1.5px;color:${SPOTLIGHT};text-align:center;">You're on the list<span style="color:${MUSTARD};">.</span></h1>
                  <p style="margin:12px auto 0 auto;max-width:360px;font-family:${BODY};font-size:16px;line-height:24px;color:${MUTED};text-align:center;">We'll email you once more, on the day Nomrank opens.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:40px 8px 0 8px;">
            <p style="margin:0;font-family:${BODY};font-size:17px;line-height:28px;color:${SPOTLIGHT};">
              Nomrank is where you rate <strong>the dish, not the place</strong>. The same restaurant can make a legendary dosa and a forgettable vada, and soon you'll know which is which.
            </p>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:32px 8px 0 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${PAPER}" style="background:${PAPER};border:1px solid ${HAIRLINE};border-radius:24px;">
              <tr>
                <td class="menu-pad" style="padding:32px;">
                  <h2 style="margin:0 0 24px 0;font-family:${DISPLAY};font-size:24px;line-height:28px;font-weight:900;letter-spacing:-0.5px;color:${SPOTLIGHT};">On the menu<span style="color:${KETCHUP};">.</span></h2>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${menu}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:40px 8px 0 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="${KETCHUP}" style="background:${KETCHUP};border-radius:999px;">
                  <a href="${site}" style="display:block;padding:18px 24px;font-family:${BODY};font-size:17px;line-height:22px;font-weight:700;color:${STUDIO};text-decoration:none;text-align:center;">Visit ${host}&nbsp;&nbsp;&rarr;</a>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0 0;font-family:${BODY};font-size:15px;line-height:24px;color:${MUTED};">
              Know someone with strong opinions about biryani? Forward this to them.
            </p>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:48px 8px 0 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid ${HAIRLINE};font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
            <p style="margin:24px 0 0 0;font-family:${WORDMARK};font-size:16px;line-height:20px;font-weight:800;letter-spacing:-0.5px;color:${SPOTLIGHT};">nomrank <span style="font-family:${BODY};font-size:14px;font-weight:400;letter-spacing:0;color:${MUTED};">Rate the dish, not the place.</span></p>
            <p style="margin:12px 0 0 0;font-family:${BODY};font-size:12px;line-height:19px;color:${FAINT};">
              You're getting this because this address joined the Nomrank waitlist at ${host}. Not you? Ignore this email and you won't hear from us again.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    "You're on the list.",
    "",
    "We'll email you once more, on the day Nomrank opens.",
    "",
    "Nomrank is where you rate the dish, not the place. The same restaurant can make a legendary dosa and a forgettable vada, and soon you'll know which is which.",
    "",
    "On the menu:",
    ...MENU.map((m) => `- ${m.dish} (${m.tag}): ${m.note}`),
    "",
    `Visit: ${site}`,
    "",
    "Know someone with strong opinions about biryani? Forward this to them.",
    "",
    `You're getting this because this address joined the Nomrank waitlist at ${host}. Not you? Ignore this email and you won't hear from us again.`,
  ].join("\n");

  return { subject, html, text };
}

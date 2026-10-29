# Auth email templates

HTML for the two emails Supabase sends for password sign-in. Supabase keeps its own copy, so changing a file here does
nothing until you paste it into the dashboard. Don't use `supabase config push` for this: it would overwrite the live
SMTP, Site URL and redirect URL settings with the values in `config.toml`.

| File | Dashboard template | Subject |
| --- | --- | --- |
| `confirm-signup.html` | Confirm sign up | Confirm your Nomrank email |
| `reset-password.html` | Reset password | Reset your Nomrank password |

Paste each one in Supabase, Authentication, Email Templates (the subject goes in the Subject field above the body).

## How the link works

The links look like `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. The token is in the link itself, so it
works in any browser or on any device. The older `{{ .ConfirmationURL }}` link used a code that only worked in the
browser that asked for it, which showed "link expired" when a mail app opened it elsewhere. `app/auth/confirm/route.ts`
turns the token into a session.

`{{ .RedirectTo }}` is the address the person signed up from (`app/login/actions.ts` passes `<origin>/auth/confirm`).
Supabase only uses it if it is on the redirect allow-list (Authentication, URL Configuration); otherwise it falls back
to the Site URL. Keep `https://beta.nomrank.in/**` and the main domain on that list.

## Admin emails (nothing to paste)

`admin/admin-invite.html` and `admin/admin-removed.html` are sample renders of the two emails the admin site sends. Unlike the
two above they are not pasted anywhere: the app builds and sends them itself (`apps/web/lib/admin-email.ts`, through Resend)
from `Nomrank Admin <admin-alerts@nomrank.in>`. Resend needs the `nomrank.in` domain verified, which `hello@nomrank.in` already needs.
Edit the wording in the code; these files are only a preview.

## Waitlist welcome (nothing to paste)

`waitlist-welcome.html` is a sample render of the email people get when they join the waitlist. The app builds and sends it
(`apps/web/lib/waitlist-email.ts`, from `hello@nomrank.in`); edit the wording in the code. It is only a preview.

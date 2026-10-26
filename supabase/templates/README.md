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

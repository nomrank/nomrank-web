# Spec: Admin site at admin.nomrank.in

Written 2026-10-29 from the owner's request.

## Objective
Admins run Nomrank from their own address, admin.nomrank.in. The consumer app (beta and, later, www) shows no admin tab or admin status at all.

## What an admin can do
- **Overview:** what needs attention (dishes waiting, open reports, banned accounts, people) and recent admin actions.
- **Dishes:** approve or reject dishes people added.
- **Reports:** remove the reported take, comment or dish, or dismiss the reports, and ban the author.
- **Restaurants:**
  - Add a restaurant (with its city).
  - Open one to edit its name, area and city, or delete it along with its dishes and their takes.
  - Add a dish to it, rename a dish or change its diet mark, or remove a dish.
- **People:**
  - Search by handle and ban or unban.
  - Open a person to see their recent takes and comments and remove any of them.
- **Admins:**
  - See who's an admin, and make someone an admin by handle.
  - Remove an admin. Never yourself, and never the last one.
- **Account:** change your own password and display name.
- **Log:** every admin action.

## How it works
- **Routing:** `proxy.ts` sends every path on an `admin.` host to the `/admin` routes, and skips the pre-launch gate there. `/auth/*` passes through so password-reset links work. On every other host `/admin` doesn't exist (404). Locally it runs at http://admin.localhost:3000.
- **Sign-in:** password only, at `/login` on the admin host. There's no sign-up there. A signed-in account that isn't an admin sees "This account isn't an admin" and a sign-out button.
- **Security:**
  - Every write goes through `security definer` database functions that check `is_admin()` and write the moderation log, as today.
  - New functions: `admin_list_admins`, `admin_set_admin`, `admin_update_restaurant`, `admin_delete_restaurant`, `admin_update_dish`.
  - Adding a dish uses the normal insert, which already auto-approves for admins.
  - No service-role key is ever used in the app.
- **Separate from the app:** the admin site has its own header, no bottom nav, is not indexed (`X-Robots-Tag: noindex`), and uses the same design tokens.

## Owner setup (can't be done from code)
- Add `admin.nomrank.in` to the Vercel project (Settings → Domains) and the DNS record Vercel shows.
- Add `https://admin.nomrank.in/**` to Supabase → Authentication → URL Configuration → Redirect URLs.

## Done when
- [x] admin.localhost shows the admin site. beta and localhost return 404 for /admin, and their menus have no Admin item.
- [x] Every action above works against the database, and the database refuses each one for non-admins. (The functions are live and every one starts with the admin check. Not yet clicked through signed in as an admin.)
- [x] tsc, eslint, vitest and `pnpm build` pass.

## Superadmin (added 2026-10-29)
- One account, username `superadmin` (default password `superadmin`), signs in on the admin site. Only it invites and removes admins; ordinary admins can't.
- Until it changes the default password, the database refuses every admin action from it, and the site shows only "Set your own password".
- Inviting: the superadmin enters an email; we email a link (valid 7 days, the database keeps only the token's hash). The person signs in with the Nomrank account for that email and accepts. Removing an admin emails them.
- Checked: `supabase/tests/superadmin.sql` (9 database checks, rolled back). Not yet clicked through signed in past the password change, and the emails weren't seen sent (needs `RESEND_API_KEY`).

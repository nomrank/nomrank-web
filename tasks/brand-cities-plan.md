# Plan: new logo, four launch cities, loaders

Written 2026-10-29. Separate from the other plan files, which keep their own open tasks.

## What exists
- **Logo:** the old mark is a mustard scalloped badge with a Suez One "n" (`lib/logo.ts`, `components/brand.tsx`). It is used by the header and footer wordmark, the loaders, the verdict chip, the favicon and Apple icon (`app/icon.tsx`, `app/apple-icon.tsx`, `lib/app-icon.tsx`), the share images (`lib/og-card.tsx`) and the emails (`supabase/templates`, `lib/waitlist-email.ts`).
- **Cities:** `restaurants.city` exists with default `Bengaluru`, and all 10 restaurants are in Bengaluru. No screen filters by city. UI copy never names a city, which is the owner's rule. Home regions (Tastes like home) already cover all of India.
- **Loaders:** most pages show `PageLoader` while they stream. Onboarding (`fallback={null}`) and reset-password (no fallback) show nothing. Clicking a link shows nothing until the next page's shell arrives, which is slow in dev.

## Decisions
- **New mark redrawn as SVG** from the supplied artwork: a cream arch with a spoon cut out, and a mustard four-point sparkle. It's vector so it stays crisp at 14px and at 512px. It goes on the plate-dark ground, not the black of the JPEG. The wordmark becomes the mark plus "nomrank" with no red full stop, as in the lockup. It stays in Plus Jakarta Sans ExtraBold, the face already loaded.
- **The score sticker's scalloped Must try badge stays.** It is a score, not the logo.
- **Cities:** Bengaluru, Mumbai, Delhi, Hyderabad, in `lib/cities.ts`.
  - The database restricts `restaurants.city` to those four.
  - Admin "Add restaurant" gets a city picker.
  - People pick a city in a row of chips on Home. It's remembered in a cookie, so it works signed out too, and "All cities" is the default.
  - The choice filters the feed, Dishes, Places, Rankings and the `/top` lists. The rate picker keeps every city, so you can rate a dish you had while travelling. Rank numbers on `/top` count within the chosen city.
- **Loaders:**
  - A branded loader: the arch holds still while the sparkle twinkles, and kitchen lines rotate underneath.
  - Onboarding and reset-password get proper fallbacks.
  - A thin ketchup progress bar at the top of the page appears on every in-app link click until the next page shows.
  - Reduced motion keeps the bar static and the sparkle still.

## Tasks
- [x] 1. Logo: SVG mark plus wordmark, used everywhere above, with icons and share images regenerated. Email templates updated (the owner re-pastes them in Supabase).
- [x] 2. Loaders: new branded loader, the missing fallbacks, and the navigation progress bar.
- [x] 3. Cities: migration, `lib/cities.ts`, admin picker, cookie and chips, filtering (feed, load more, tabs, rankings, `/top`), and copy listing the four launch cities.
- [x] Checkpoint: tsc, eslint, vitest, `pnpm build`, and a look at 375px and desktop.

## Not doing
- Per-city leaderboards in the database. Filtering the global order by city gives the same order, so the view stays as it is.
- Geolocation to guess the city. The person picks it.
- New home regions. The ten already cover these cities' food homes.

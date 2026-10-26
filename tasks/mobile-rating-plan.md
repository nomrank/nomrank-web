# Implementation Plan: Mobile polish, bottom nav, new rating control

Written 2026-10-26. Separate from `plan.md` (Auth + onboarding), which still has open tasks.

## Overview

Four requests from the beta test:

1. "Sign up says the user already exists just because they joined the waitlist."
2. The cellular-bars rating control feels generic. Replace it with something unique that could also become the logo.
3. On phones there is extra empty space under every post and under the footer.
4. Phones need a bottom navigation bar like Instagram or Reddit.

## What the investigation found

| Request | Finding |
| --- | --- |
| 1. Sign-up "already exists" | Not a waitlist bug. `joinWaitlist` only inserts into `public.waitlist`; the table has no triggers and never touches `auth.users`. The one email present in both tables joined the waitlist on 24 Oct and completed a real beta sign-up on 26 Oct (confirmed, signed in, profile created). So the message is the app answering correctly. What is missing is a way forward from that message. |
| 3. Extra space | Measured at 375px. Under each post: about 27px of empty space under "100% agree" (post `py-5` plus the vote row), 20px more above the next title. After the last post: about 144px (feed loader row `py-6`, `min-h-16`, plus footer `mt-16`). Under the footer: 24px (`pb-[max(env(safe-area-inset-bottom),1.5rem)]`, which grows to the home-indicator height on iPhones). |
| 4. Bottom nav | Rate button, bell and avatar menu exist only in the home page header (`home-view.tsx`). Other pages show just the wordmark. A nav needs the viewer's handle and unread count on every browsing page, so it must be fetched in a server component under `<Suspense>` (Next 16 Cache Components fails the build otherwise, as the reset-password page did). |
| 2. Rating control | `components/score-meter.tsx`, used by `app/rate/rate-form.tsx` and the coming-soon hero. Its API is `{ score, onChange }`, so a new control can replace it without touching callers. |

## Architecture decisions

- **Dependency order:** spacing first (nav needs the new bottom padding), then nav, then rating. The rating control is independent and waits on the design pick.
- **Rating control keeps the contract:** 1 to 10 in half steps, hidden native `<input type="range">` for keyboard and screen readers, same `{ score, onChange }` props, same verdict names and colours from `lib/ratings.ts`.
- **Concept A, the score dial (recommended):** a ring of 19 overlapping scallops (one per half step) that light up from ketchup to mustard as you turn it, with the number and verdict in the middle and the brand's dashed ring inside. The lit ring at 10 is the Must try badge's scalloped edge, which is what makes it a credible logo later. Drag around the ring or tap a petal. Pure maths lives in `lib/dial.ts` (angle to value) so it can be unit tested.
- **Concept B, the sticker slider:** the score sticker rides a flat track. Simpler and wider, closer to a normal slider.
- **Bottom nav:** client component for the active tab and for hiding on focused screens; a server wrapper in `app/layout.tsx` (under `<Suspense>`) supplies handle, avatar and unread count. Visible below `md` only.
- **Tabs:** Home, Rankings, Rate (centre, raised), Activity (with unread badge), You (avatar). Signed out: Home, Rankings, Sign in.
- **Hidden on:** `/login`, `/onboarding`, `/rate`, `/reset-password`, `/suspended`, `/coming-soon`.
- **Header on phones:** Rate, bell and avatar move to the nav, so the home header keeps only the wordmark (plus "Sign in" when signed out).

## Task List

Detailed tasks, acceptance criteria and verification are in `mobile-rating-todo.md`.

### Phase 1: Fixes
- [ ] Task 1: Sign-up "already has an account" gives a one-tap way to sign in
- [ ] Task 2: Remove the extra space under posts, the feed and the footer on phones

### Checkpoint: Fixes
- [ ] Tests, lint and production build pass
- [ ] Phone screenshots show the tighter spacing

### Phase 2: Navigation
- [ ] Task 3: Bottom navigation bar on phones

### Checkpoint: Navigation
- [ ] Production build passes (Suspense around the cookie read)
- [ ] Nav checked signed out and signed in on a phone-sized screen

### Phase 3: Rating control
- [ ] Task 4: Dial maths and tests
- [ ] Task 5: Score dial component replaces the bars on /rate and the coming-soon hero

### Checkpoint: Complete
- [ ] Keyboard, touch and pointer all set a score; screen reader announces value and verdict
- [ ] Production build passes
- [ ] Reviewed on a phone

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A fixed bar covers the last content | High | Reserve the nav height plus safe area in `PageShell` bottom padding; check the last post and footer on a phone |
| Cookie read in layout breaks the production build | High | `<Suspense>` boundary (same fix as `/reset-password`); run `pnpm build` before pushing |
| Dragging the dial scrolls the page on touch | Med | `touch-action: none` on the dial only; the rest of the page scrolls normally |
| Dial is harder to use than a bar | Med | Tap a petal as well as drag; arrow keys step by half a point; nothing in the dial needs precision finer than the 19 petals |
| Nav on a focused screen is in the way | Med | Hidden on the routes listed above |
| Overwriting someone's work in `plan.md` / `todo.md` | n/a | Not done: this plan is in new files |

## Open questions

- Rating concept: A (dial, recommended) or B (sticker slider)?
- Is the tab set right (Home, Rankings, Rate, Activity, You)?
- Using the dial as the logo is out of scope here; we can revisit once the control is built.

## Status 2026-10-26

Tasks 1 to 3 built. Tasks 4 and 5 (new rating control) deferred: the owner rejected the scallop dial and sticker slider, then passed on Orbit, Fan and Pour. The old control and score sticker stay for now.

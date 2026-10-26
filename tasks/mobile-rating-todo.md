# Todo: Mobile polish, bottom nav, new rating control

Plan: `mobile-rating-plan.md`. Verification commands run from `apps/web`: `pnpm exec vitest run`, `pnpm exec tsc --noEmit`, `pnpm exec eslint .`, and `pnpm build` (stop the dev server first and clear `.next` afterwards).

## Task 1 (done): Sign-up "already has an account" offers a way in

**Description:** The message is correct but a dead end. Add a "Sign in instead" action that switches to the Sign in tab with the email kept.

**Acceptance criteria:**
- [ ] After the "already has an account" error, a "Sign in instead" button switches to Sign in with the same email filled in
- [ ] The wrong-password message still does not reveal whether an account exists

**Verification:**
- [ ] `vitest`, `tsc`, `eslint` pass
- [ ] Manual: sign up with an existing email on a phone-sized screen, tap the button, land on Sign in with the email filled

**Dependencies:** None
**Files likely touched:** `app/login/login-screen.tsx`
**Estimated scope:** XS

## Task 2 (done): Remove the extra space on phones

**Description:** Tighten the space under each post, after the last post, and under the footer, below the `md` breakpoint only.

**Acceptance criteria:**
- [ ] Space under "100% agree" before the divider is about 12px (was about 27px)
- [x] Space between the last post and the footer is at most 64px, including the "all caught up" line (was about 144px; measured 62px)
- [ ] Space under the footer is the home-indicator height on iPhones and 16px elsewhere (was 24px or more)
- [ ] Desktop layout unchanged

**Verification:**
- [ ] Measured with the same script as the investigation at 375px
- [ ] Screenshots of a post, the feed end and the footer

**Dependencies:** None
**Files likely touched:** `components/review-card.tsx`, `app/home-view.tsx`, `components/site-footer.tsx`, `components/page-shell.tsx`
**Estimated scope:** S

### Checkpoint: after Tasks 1 and 2
- [ ] Tests, types, lint pass
- [ ] `pnpm build` passes
- [ ] Review with human

## Task 3 (done): Bottom navigation bar on phones

**Description:** A fixed bar below `md` with Home, Rankings, Rate (raised centre), Activity (unread badge) and You (avatar). Signed out shows Home, Rankings and Sign in. Hidden on focused screens.

**Acceptance criteria:**
- [ ] Bar shows on phones on browsing pages, never at `md` and up
- [ ] Active tab is highlighted; Activity shows the unread count like the header bell does
- [ ] Hidden on `/login`, `/onboarding`, `/rate`, `/reset-password`, `/suspended`, `/coming-soon`
- [ ] Content and footer are never covered: bottom padding equals nav height plus safe area
- [ ] Tap targets are at least 44px; each tab has an accessible name; current tab uses `aria-current="page"`
- [x] Home header on phones no longer repeats Rate and the bell. The avatar stays: it opens settings and sign out, which have no other route on phones

**Verification:**
- [ ] `vitest`, `tsc`, `eslint` pass; a unit test for "is the nav hidden on this path"
- [ ] `pnpm build` passes
- [ ] Manual at 375px signed out; signed in checked with a test account or fixture

**Dependencies:** Task 2
**Files likely touched:** `components/mobile-nav.tsx` (new), `app/layout.tsx`, `components/page-shell.tsx`, `app/home-view.tsx`, a small server helper for handle and unread count
**Estimated scope:** M

### Checkpoint: after Task 3
- [ ] Production build passes
- [ ] Nav works signed out and signed in on a phone-sized screen
- [ ] Review with human

## Task 4 (deferred): Dial maths and tests

**Description:** Pure functions mapping a pointer angle to a score (and a score to a petal angle) for the 270 degree dial, including the dead zone at the bottom.

**Acceptance criteria:**
- [ ] Angle to value covers 1 to 10 in half steps, and snaps the dead zone to the nearer end
- [ ] Round trip: value to angle to value returns the same value for every half step

**Verification:**
- [ ] New unit tests pass

**Dependencies:** Design pick
**Files likely touched:** `lib/dial.ts` (new), `lib/dial.test.ts` (new)
**Estimated scope:** XS

## Task 5 (deferred): Score dial replaces the bars

**Deferred 2026-10-26:** the owner passed on the three concepts (Orbit, Fan, Pour) and will revisit the rating design later. The existing control and score sticker stay.

**Description:** The new control with the same props as `ScoreMeter`. Petals light up ketchup to mustard; tap or drag; arrow keys; number and verdict in the centre; reduced motion respected.

**Acceptance criteria:**
- [ ] `/rate` and the coming-soon hero use it; no caller changes
- [ ] Pointer, touch (page still scrolls outside the dial) and keyboard all set a score
- [ ] Screen reader hears "N out of 10, verdict"; focus ring visible
- [ ] Looks right at 280px wide up to desktop; no bars remain
- [ ] `prefers-reduced-motion`: petals change colour without the ripple

**Verification:**
- [ ] `vitest`, `tsc`, `eslint`, `pnpm build` pass
- [ ] Manual on a phone-sized screen: drag, tap, keyboard
- [ ] taste-skill inspector on `/coming-soon`

**Dependencies:** Task 4
**Files likely touched:** `components/score-meter.tsx`, `app/coming-soon/score-demo.tsx`, `app/globals.css`, `DESIGN.md`
**Estimated scope:** M

### Checkpoint: complete
- [ ] All acceptance criteria met
- [ ] Production build passes
- [ ] Reviewed on a phone, then push

---
name: Nomrank
description: Broadcast your bites. Rate the dish, not the place.
colors:
  studio: "#17111c"
  ketchup: "#ff4b3a"
  mustard: "#ffc23c"
  spotlight: "#fff4ea"
  paper: "#211a27"
  raised: "#2a2231"
  hairline: "#2f2737"
  muted-ink: "#b3a8b9"
  faint: "#8e8296"
  field-border: "#6e6377"
  error: "#ff8a7d"
typography:
  wordmark:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
  body:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  overline:
    fontFamily: "Geist, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  control: "6px"
  pill: "9999px"
spacing:
  gutter: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ketchup}"
    textColor: "{colors.studio}"
    rounded: "{rounded.control}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.spotlight}"
    rounded: "{rounded.control}"
    height: "44px"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.spotlight}"
    rounded: "{rounded.control}"
    height: "48px"
  score:
    backgroundColor: "{colors.ketchup}"
    textColor: "{colors.studio}"
    rounded: "{rounded.pill}"
    size: "28px"
---

# Design System: Nomrank

## Overview

**Creative North Star: "Letterboxd for dishes"**

Chosen by the owner on 2026-10-22 after rejecting the loud sticker/brutalist version as "AI slop". The brand stays (owner's brand sheet: the "nomrank." wordmark, Studio / Ketchup / Mustard / Spotlight), but it is used the way Letterboxd uses its colours: a dark ground, small precise type, hairline structure, and colour only where it carries meaning.

**Key Characteristics:**
- Dark Studio ground, cream text, grey-purple secondary text.
- Ketchup means "score" and "the main action". Mustard means "Agree" and "you are here" (active tab, active sort, focus).
- Geist for UI; Plus Jakarta Sans ExtraBold only for the wordmark; Suez One only for the mark's "n".
- Lists separated by hairlines, not cards. No shadows, no outlines on content, no tilts.

## Colors

- **Studio** (#17111C): the page.
- **Raised** (#2A2231): fields, tiles, avatars, hover. **Paper** (#211A27): reserved for future sheets.
- **Spotlight** (#FFF4EA): primary text. **Muted ink** (#B3A8B9) secondary text; **Faint** (#8E8296, 4.9:1) timestamps, counts, overlines.
- **Hairline** (#2F2737): dividers. **Field border** (#6E6377, 3.28:1): input outlines.
- **Ketchup** (#FF4B3A): bitten score discs, the average, lit meter bars, the on-air light, Disagree when chosen, primary buttons (Studio text, 5.6:1).
- **Mustard** (#FFC23C): Agree when chosen, the active tab underline, active sort, focus rings, the one highlighted word on sign-in.

### Named Rules
**The Meaning Rule.** Ketchup and Mustard appear only where they mean something (score/action, Agree/current). Never decoration.
**The No-Chrome Rule.** No shadows, no outlined cards, no tilted or stamped elements. Structure comes from spacing and hairlines.

## Typography

**UI:** Geist. **Wordmark:** Plus Jakarta Sans ExtraBold, lowercase "nomrank." with a Ketchup full stop; the mark's "n" is Suez One. Both chosen by the owner on 2026-10-24.

**The mark** (`lib/logo.ts`, `LogoMark` in `components/brand.tsx`): the scalloped Must try badge in Mustard, upright, with a dashed ring at 40px and up and a Suez One "n" in Studio. The app icon puts it on a Ketchup tile (`app/icon.tsx`, `app/apple-icon.tsx`, generated with next/og). The header lockup is the mark plus the wordmark.

- **Title** (700, 1.75rem): dish names, sign-in headline.
- **Headline** (700, 1.5rem): other page titles.
- **Body** (400, 0.9375rem, 1.6): takes and reading text.
- **Label** (600, 0.875rem): usernames, tabs, buttons.
- **Overline** (600, 0.75rem, 0.08em, uppercase, Faint): section labels ("Takes · 2", "Average", neighbourhoods).
- Numbers are tabular wherever they line up.

## Layout

One column, max 576px, 20px gutters, safe-area aware. Header: wordmark left, the Rate button right (no floating buttons). Tabs are text with a Mustard underline. Sign-up screens are a narrow column with three progress dots in the header (Ketchup once a step is done).

## Components

- **ReviewCard** (`components/review-card.tsx`): a take as a list item: avatar initial, @handle, Ketchup score disc, relative time; dish · place; the take (clamped to 6 lines in lists); a 3:4 photo thumbnail on the right ("+N"); Agree/Disagree. On the review page: unclamped with a photo swipe row.
- **VoteButtons** (`components/vote-buttons.tsx`): one joined pill, "Agree 214 | Disagree 12" (13px semibold), hairline border on Raised. The chosen half fills from its outer edge (Agree → Mustard, Disagree → Ketchup, Studio text). Beside it, "95% agree" with a 40px agreement bar. Signed out: same look, links to sign-in. Own take: counts only.
- **Dish page**: title + photo poster, an Average block with a thin-bar 1–10 histogram between hairlines, the Rate button, then takes.
- **Rate form**: 1–10 tiles (selected → Ketchup), take textarea with counter, up to 4 photo squares.
- **Comments** (`components/comments.tsx`): overline "Comments · N", a composer, then threads: avatar initial, @handle, time, body; replies indented one level behind a 1px hairline. Reply opens an inline composer; Delete asks "Delete it / Keep" first. Comments that appear after the page loaded rise in (260ms); the rest stay still.
- **Comment count** on every take row (speech-bubble icon + number) links to `#comments`.
- **Coming soon page** (`app/coming-soon`): a Persuade surface where the product shows itself, on one page width (76rem, 20/32/40px margins) for every section. Hero: headline, sentence and waitlist form beside the app's real rating screen in miniature (`ScoreMeter` from `components/score-meter.tsx`, shared with /rate, driving the `Score` sticker on the dish photo). Then "Every take is up for debate.": a comment box with a Post button beside a take card on a Spotlight panel; posting adds the comment to the card's thread (styled like the app's comments, latest three shown), and its Agree/Disagree work in demo mode. Then the features as the app's own search list (type to filter, the selected row on Ketchup) with a still example for each built from app components (the six-tier verdict scale, a Top Biryani list, Tastes like home, a take with its vote counts, Spaces, people to follow); it steps to the next feature every 3 seconds while on screen, stops when you pick one or press Pause, resumes on Play, and never runs under reduced motion. The take card's Agree/Disagree use VoteButtons' `demo` mode, which never saves. Close: a full Ketchup band with the signup dialog open. No sample labels; dish photos are credited Wikimedia Commons images in `public/coming-soon/`. Motion: headline lines rise from their baselines, section parts rise in once, dish photos drift slowly.
- **Verdict chip** (`components/verdict.tsx`, `verdict()` in `lib/ratings.ts`): the score in words, six tiers. 9–10 Must try (Mustard tint, with the Nomrank badge), 8–8.9 Order again (Mustard text), 6.5–7.9 Clean plate (Spotlight), 5–6.4 Just okay (muted), 3–4.9 Skip it (Ketchup text), below 3 Send it back (Ketchup tint). Only Must try turns the score sticker into the scalloped badge.
- **Wordmark / LogoMark** (`components/brand.tsx`; the loader turns the mark slowly), **Screen**, **PageShell** (with an `action` slot), **Row**.

## What makes it Nomrank, not Letterboxd

- **Bitten score disc:** scores sit in a Ketchup circle with a bite taken out of its top-right (after the logo's bites).
- **Rating plate:** rating is a ring of 10 slices, each split in two for half points; tap a slice or drag round it and the lit slices, the big number and the verdict all take the score's colour (ketchup to mustard). The slice just reached lifts out of the ring a touch. A hidden range input keeps keyboard and screen-reader use.
- **On air:** a small Ketchup light pulses beside "New" on the feed.
- **Agreement bar:** every take shows how much people agree with it, not just raw counts.

## Motion

Curves: `--ease-out` cubic-bezier(0.23, 1, 0.32, 1) for UI, `--ease-in-out` cubic-bezier(0.77, 0, 0.175, 1) for things moving on screen. Never ease-in. Under reduced motion every animation and view transition collapses to an instant change (the meter, counts and tabs still change state).

| Moment | Purpose | Motion |
|---|---|---|
| Agree / Disagree | Feedback | The chosen half fills from its outer edge (scaleX 0→1, 200ms, --ease-out); counts roll up or down (180ms); the agreement bar slides to the new share (300ms). Transitions, not keyframes, so rapid taps retarget. After saving, the page re-reads the real counts. |
| Signal meter | State indication | Bars that change colour ripple outward from the previous score, 22ms apart (150ms colour transition each); the big number rolls up (180ms). |
| Score spread (dish page) | Preventing a jarring change | Bars grow from the baseline (320ms, 25ms stagger). |
| Tabs | Spatial consistency | The Mustard underline is one named view transition that slides between tabs (220ms, ease-in-out). |
| Page arrival | Preventing a jarring change | Content rises 10px and fades in (260ms) via `<ViewTransition enter="rise">` in PageShell. |
| On air | State indication | Opacity pulse, 1.6s loop; static under reduced motion. |

## Do's and Don'ts

- Do let the take be plain, readable text. The words are the content.
- Do keep colour for meaning only.
- Don't bring back shadows, thick outlines, stickers, tilts, highlighter swipes or alternating card colours.
- Don't write quirky filler copy; say what happens.
- Don't put a label or kicker above a headline. Overlines label sections, never page titles.
- Don't name a city in UI copy, or frame regions against each other.

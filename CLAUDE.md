# Nomrank

An Indian food app where people rate **individual dishes** (not restaurants), argue about them, and find what's worth eating. Signature feature: **Tastes like home**, which shows how people from a dish's home region rate it (e.g. Hyderabadis on biryani).

Launch: Bengaluru, Mumbai, Delhi and Hyderabad (cities in `apps/web/lib/cities.ts`), web app first (mobile-first PWA). Android/iOS apps come later via Expo, reusing shared code.

## Stack
- **Web:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Supabase cloud (Postgres, Auth, Storage, Realtime), region Mumbai. Security via Row Level Security, never via client checks.
- **Repo:** pnpm workspace. `apps/web` now; `apps/mobile` (Expo) later; shared types/validation/queries go in `packages/` only once a second app needs them.
- **Deployment:** not yet. Develop locally against the Supabase cloud dev project.
- Secrets live in `apps/web/.env.local` (git-ignored). Only the publishable/anon key is used client-side; never commit or use the service-role key in the web app.

## v1 scope (build in this order)
1. Auth (email first; Google + phone OTP later) and onboarding: username + **home region**
2. Restaurants (seed list of popular spots in the launch cities + user-added, with duplicate handling) and dishes (optional `origin_region`)
3. Spaces: one leaderboard per food (Biryani, Dosa, ...), anyone can create one
4. Reviews: rating 1–10, short hot take, photos. One review per user per dish.
5. Feed with **Agree** / **Disagree** votes on takes (stored internally as `facts` / `cap`)
6. Tastes like home score on each dish
7. Report button on reviews, dishes, Spaces

**Next:** Battles (one weekly battle). **Later:** Offers, bracket tournaments, badges, saved dishes, Instagram handle, first-time tour, moderation dashboard.

## Product rules
- **Leaderboard rank** uses a Bayesian (weighted) average, so one 10/10 can't top a Space.
- **Tastes like home** = average rating from users whose `home_region` equals the dish's `origin_region`. Show only when there are 3 or more such ratings, with the count ("8.7 from 12 Hyderabadis"). Hidden for dishes with no origin region.
- One `home_region` per user.
- Anti-gaming: one rating per user per dish; new accounts weigh less in rankings.
- Tone: playful, Gen-Z, celebrating home food. Never region-vs-region framing.

## Skills: which to use for what
| Job | Skill |
|---|---|
| Workflow | Addy's `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` |
| Visual design of screens | `impeccable` (the one design authority; don't mix in hallmark/taste/design-screen unless asked) |
| Components | `shadcn` |
| React/Next perf | `vercel-react-best-practices` |
| Feel native on phones | `mobile-native` |
| Motion | `emil-design-eng`, `animate` |
| Copy | `ux-writing` |
| Supabase (auth, RLS, storage, migrations) | `supabase` |
| Schema, indexes, queries | `postgres-best-practices` |
| Security | `security-and-hardening` |
| Before calling a feature done | `a11y-audit`, `break-ui`, `ponytail-review` |
| Simplicity | `ponytail` (always on) |
| Mobile, later | `expo` plugin, `animate-expo` |

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.

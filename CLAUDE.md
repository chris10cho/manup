# Manup: project notes for Claude

Mobile-first workout tracker (React + TypeScript + Vite PWA). Claude is the trainer; the app logs and adapts. Data lives on the user's phone (IndexedDB). Deployed to GitHub Pages at `/manup/`.

## The user and their goals (keep the program consistent with these)
- Switched from gym lifting to calisthenics (Nov 2026; the gym got too crowded). Old gym data was wiped on purpose.
- Equipment: ONLY a doorframe pull-up bar (wide, normal, neutral and chin-up grips), floor, wall, a chair. No rings, no parallettes, no dip bars, no weights. Front lever torque can tip a hook-over-the-trim doorframe bar; keep that warning in the notes.
- Goals, in priority order:
  1. Front lever (start: tuck lever 5 to 10 s).
  2. Planche and handstand push-up (start: chest-to-wall handstand 30 s+).
  3. Core strength (L-sit, hollow body, hanging leg raises).
  4. Flexibility (pike, pancake, shoulders, wrists).
- Wants training to be fun: pull-up, push-up, legs and core slots pick a random variation each workout.
- Outside training: climbs Saturday, plays soccer Sunday morning.
- Weekly layout: Mon pull + front lever, Tue push + handstand + planche, Wed legs + core, Thu optional skills + wildcard, Fri flexibility, Sat climb, Sun soccer.
- Rules of thumb: no pulling on Friday (grip fresh for Saturday climbing). Legs midweek, away from Sunday soccer. Sessions 45 to 60 min. Skills first in a session, while fresh.

## Where things are
- `src/seed.ts`: the built-in calisthenics program, profile and trainer notes. Edit this to change the program. Helpers: `pool()` (random variation slot), `ladder()` (skill progression), `stretch()`, `warmup()`.
- `src/engine/variation.ts`: `pickVariation()` for random slots.
- `src/engine/progression.ts`: adaptation rules (add weight on all reps hit, double on "easy", hold on a miss, about -10% after two misses, deload every 4th week). Pure functions with tests.
- `src/engine/program.ts`: generic program generator (not used by the built-in program).
- `src/store.tsx`: app state; pure helpers `buildSession()` (random picks), `rerollSlot()` (Shuffle), `applyFinish()` (progression + skill-level sharing), `migrate()`, `nextDay()`.
- `src/db.ts`: IndexedDB persistence (opens lazily).
- `scripts/build-library.mjs`: builds `src/data/exercises.json` from free-exercise-db plus custom drills (prefixed `X_`). Needs the db's `exercises.json` path as an argument.
- `src/index.css`: design tokens (light/dark via `prefers-color-scheme`).

## Conventions
- **Changing the built-in program:** edit `src/seed.ts` AND bump `SEED_PROGRAM.id` (`seed-N`). `migrate()` swaps it in on the phone, keeping each slot's progress (by day id + slot index) when the slot is still the same pool/ladder/exercise. Programs imported from the trainer have non-`seed-` ids and are never overwritten. Bumping `STATE_VERSION` in `store.tsx` WIPES all saved data; only do that on purpose.
- **Slots, not exercise ids:** sets are logged per slot index (`SetLog.slot`), because random pools change the exercise. Pools: `pool` + `calibrate` (first session sets the rep target). Ladders: `ladder`, `level`, `levelUpAt`, `resetTo`, `incr`, and a `skill` key; a level reached on one day is copied to the same skill on other days. Warm-ups use `fixed` (never progress).
- Mobility/stretch exercises (`kind: 'mobility'`) and `fixed` warm-ups are never progressed. Timed holds cap at `MAX_HOLD_SEC`.
- Exercise ids must exist in `src/data/exercises.json` (a test checks the seed). Demo photos are start/end frames from free-exercise-db; custom drills borrow photos from a similar move and say so.
- Style: "gym logbook". Paper/ink surfaces, ruled sections, square corners, condensed uppercase headings (Barlow Condensed), a single green accent, no emoji, no shadows or rounded cards. Use the CSS variables in `index.css`; do not hard-code colours. Keep touch targets at least 48px. The app icon (`public/icon*.png`, `icon.svg`) is the one deliberate exception: a 3D chalk handprint on lit slate (chosen Nov 2026 after rejecting barbell and silhouette options), full-bleed with no dark frame (a dark frame shows as a black box on the phone home screen). Icon art keeps content inside the central 410px safe zone.
- Vite `base` is `/manup/`; asset and manifest paths depend on it.

## Commands
```bash
npm run dev     # local dev server
npm test        # vitest (progression, pools, ladders, migration, schedule)
npm run build   # tsc + vite build (what CI runs)
```

## Deploy
`.github/workflows/deploy.yml` runs tests, builds, and publishes to GitHub Pages. It triggers on pushes to `main` and on manual dispatch.

Known snag: GitHub made `claude/manup-first-version` the repo's default branch, and the `github-pages` environment currently only accepts that branch, so a push to `main` builds fine but its deploy step is rejected. Until Settings > Environments > github-pages > Deployment branches also allows `main` (or the default branch is switched to `main`), deploy by dispatching the workflow on the allowed branch:

```bash
gh api -X POST repos/chris10cho/manup/actions/workflows/deploy.yml/dispatches -f ref=claude/manup-first-version
```

Keep `main` and `claude/manup-first-version` at the same commit when you do this.

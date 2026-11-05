# Manup: project notes for Claude

Mobile-first workout tracker (React + TypeScript + Vite PWA). Claude is the trainer; the app logs and adapts. Data lives on the user's phone (IndexedDB). Deployed to GitHub Pages at `/manup/`.

## The user and their goals (keep the program consistent with these)
- Intermediate lifter, ex powerlifting team. Equipment: squat rack, bench, barbell, dumbbells, kettlebells, a pull-up bar/cable station (also used for jump-up straight-bar dips). Units: lb. No injuries.
- Goals, in priority order:
  1. Strength: bench press 225 lb (was 175 x 2, estimated max about 185).
  2. Skill: 10 muscle-ups (12 strict pull-ups).
  3. Mobility and flexibility: shoulders, wrists, hips, hamstrings. This is a real goal, not an afterthought.
- Outside training: climbs Saturday, plays soccer Sunday morning.
- Weekly layout: Mon heavy bench + pull, Tue legs, Wed muscle-up skill + bench volume, Thu optional pull, Fri mobility, Sat climb, Sun soccer.
- Rules of thumb: no pulling day on Friday (forearms and lats must be fresh for Saturday). Keep legs away from Sunday soccer. Sessions are 45 to 60 min.

## Where things are
- `src/seed.ts`: the built-in program, profile and trainer notes. Edit this to change the program.
- `src/engine/progression.ts`: adaptation rules (add weight on all reps hit, double on "easy", hold on a miss, about -10% after two misses, deload every 4th week). Pure functions with tests.
- `src/engine/program.ts`: generic program generator (not used by the built-in program).
- `src/store.tsx`: app state, finishing a workout, `migrate()`, `nextDay()` (suggests today's planned weekday).
- `src/db.ts`: IndexedDB persistence (opens lazily).
- `scripts/build-library.mjs`: builds `src/data/exercises.json` from free-exercise-db plus custom drills (prefixed `X_`). Needs the db's `exercises.json` path as an argument.
- `src/index.css`: design tokens (light/dark via `prefers-color-scheme`).

## Conventions
- **Changing the built-in program:** edit `src/seed.ts` AND bump `SEED_PROGRAM.id` (`seed-N`). `migrate()` then swaps it in on users' phones while keeping their weights and week. Programs imported from the trainer have non-`seed-` ids and are never overwritten.
- Mobility/stretch exercises (`kind: 'mobility'`) are never progressed. Timed holds cap at `MAX_HOLD_SEC`.
- Exercise ids must exist in `src/data/exercises.json` (a test checks the seed). Demo photos are start/end frames from free-exercise-db; custom drills borrow photos from a similar move and say so.
- Style: "gym logbook". Paper/ink surfaces, ruled sections, square corners, condensed uppercase headings (Barlow Condensed), a single green accent, no emoji, no shadows or rounded cards. Use the CSS variables in `index.css`; do not hard-code colours. Keep touch targets at least 48px.
- Vite `base` is `/manup/`; asset and manifest paths depend on it.

## Commands
```bash
npm run dev     # local dev server
npm test        # vitest (progression, program, migration, schedule)
npm run build   # tsc + vite build (what CI runs)
```

## Deploy
`.github/workflows/deploy.yml` runs tests, builds, and publishes to GitHub Pages. It triggers on pushes to `main` and on manual dispatch.

Known snag: GitHub made `claude/manup-first-version` the repo's default branch, and the `github-pages` environment currently only accepts that branch, so a push to `main` builds fine but its deploy step is rejected. Until Settings > Environments > github-pages > Deployment branches also allows `main` (or the default branch is switched to `main`), deploy by dispatching the workflow on the allowed branch:

```bash
gh api -X POST repos/chris10cho/manup/actions/workflows/deploy.yml/dispatches -f ref=claude/manup-first-version
```

Keep `main` and `claude/manup-first-version` at the same commit when you do this.

import type { PlanExercise, PlanDay, Profile, Program } from './types'

/** Shorthand so the program below stays readable. weight=null means "log your first set and I'll remember it". */
const ex = (
  exerciseId: string,
  sets: number,
  target: number,
  weight: number | null,
  opts: Partial<PlanExercise> = {},
): PlanExercise => ({
  exerciseId,
  sets,
  target,
  unit: 'reps',
  restSec: 90,
  weight,
  missStreak: 0,
  ...opts,
})
const hold = (id: string, sets: number, sec: number, rest = 45) =>
  ex(id, sets, sec, null, { unit: 'sec', restSec: rest })

export const SEED_PROFILE: Profile = {
  goals: [
    { id: 'g1', type: 'strength', target: 'Bench press 225 lb (now 175 x 2)' },
    { id: 'g2', type: 'skill', target: '10 muscle-ups (now 12 strict pull-ups)' },
  ],
  level: 'intermediate',
  equipment: ['gym', 'dumbbell', 'kettlebell', 'bodyweight'],
  daysPerWeek: 4,
  minutes: 60,
  units: 'lb',
  limits: '',
  createdAt: new Date().toISOString(),
}

const days: PlanDay[] = [
  {
    id: 'd0',
    label: 'Day 1 · Heavy Bench + Pull Strength',
    focus: 'Bench strength, weighted pulls',
    exercises: [
      ex('Barbell_Bench_Press_-_Medium_Grip', 4, 4, 150, {
        restSec: 180,
        note: 'Heavy day. Estimated from your 175 x 2. Adjust the weight on set 1 if it is way off.',
      }),
      ex('X_Weighted_Pullup', 4, 5, 25, {
        restSec: 120,
        note: 'Dumbbell between your feet. Full hang, chin over bar, 2 second lower.',
      }),
      ex('Seated_Cable_Rows', 3, 10, null, { restSec: 90 }),
      ex('Cable_Rope_Overhead_Triceps_Extension', 3, 12, null, { restSec: 60 }),
      ex('Face_Pull', 3, 15, null, { restSec: 60, note: 'Shoulder health. Keep it light.' }),
    ],
  },
  {
    id: 'd1',
    label: 'Day 2 · Lower Body',
    focus: 'Squat, hinge, single leg, core',
    exercises: [
      ex('Barbell_Squat', 4, 5, null, { restSec: 150 }),
      ex('Romanian_Deadlift', 3, 8, null, { restSec: 120 }),
      ex('Split_Squat_with_Dumbbells', 3, 10, null, { restSec: 90, note: 'Per leg.' }),
      ex('Hanging_Leg_Raise', 3, 10, null, { unit: 'reps', restSec: 60 }),
      hold('Plank', 3, 45),
    ],
  },
  {
    id: 'd2',
    label: 'Day 3 · Muscle-Up Skill + Bench Volume',
    focus: 'Explosive pulling, transition, bench volume',
    exercises: [
      ex('X_Explosive_Pullup', 5, 3, null, {
        restSec: 120,
        note: 'Do these fresh. Fast pull, bar to lower chest. Stop when the bar stops reaching your chest.',
      }),
      ex('X_MU_Transition', 4, 3, null, {
        restSec: 90,
        note: 'Jump or step to chest height, roll over, lower slowly. Quality only.',
      }),
      hold('X_False_Grip_Hang', 3, 20, 60),
      ex('Barbell_Bench_Press_-_Medium_Grip', 4, 8, 125, { restSec: 120, note: 'Volume day. Lighter, clean reps.' }),
      ex('Weighted_Bench_Dip', 3, 10, null, {
        restSec: 90,
        note: 'Stand-in for bar dips. Weight on your lap. Dip strength is what finishes a muscle-up.',
      }),
    ],
  },
  {
    id: 'd3',
    label: 'Day 4 (optional) · Pull + Shoulders + Hips',
    focus: 'Pull volume, shoulders, swings',
    optional: true,
    exercises: [
      ex('Pullups', 4, 8, null, { restSec: 90, note: 'Strict, full range. Add reps before adding weight.' }),
      ex('Wide-Grip_Lat_Pulldown', 3, 10, null, { restSec: 90 }),
      ex('One-Arm_Dumbbell_Row', 3, 10, null, { restSec: 75, note: 'Per arm.' }),
      ex('Dumbbell_Shoulder_Press', 3, 10, null, { restSec: 90 }),
      ex('Hammer_Curls', 3, 12, null, { restSec: 60, note: 'Climbing keeps your elbows busy, so keep this light.' }),
      ex('One-Arm_Kettlebell_Swings', 3, 15, null, { restSec: 60 }),
    ],
  },
]

export const SEED_PROGRAM: Program = {
  id: 'seed-1',
  createdAt: new Date().toISOString(),
  week: 1,
  cycleDone: 0,
  days,
  notes: [
    'Bench: your estimated max is about 185 lb (from 175 x 2), so 225 is about +40 lb. At 2 bench days per week, plan on roughly 16 to 24 weeks.',
    'Muscle-up: with 12 strict pull-ups and climbing, a first muscle-up often lands in 2 to 4 months. 10 in a row is a longer road, think 6 to 12+ months.',
    'Soccer and climbing count as training. Keep Day 2 (legs) away from soccer day, and keep Day 4 light before a hard climbing session.',
    'Only have 3 days? Skip Day 4. It is the first thing to drop.',
    'Every 4th week is a lighter deload week (about 85% weight, fewer sets). Do not skip it.',
    'Starting weights marked blank are calibrated from the first set you log.',
  ],
}

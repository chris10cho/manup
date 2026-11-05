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
const stretch = (id: string, sets = 2, sec = 30, note?: string) =>
  ex(id, sets, sec, null, { unit: 'sec', restSec: 10, note })

export const SEED_PROFILE: Profile = {
  goals: [
    { id: 'g1', type: 'strength', target: 'Bench press 225 lb (now 175 x 2)' },
    { id: 'g2', type: 'skill', target: '10 muscle-ups (now 12 strict pull-ups)' },
    { id: 'g3', type: 'mobility', target: 'Mobility and flexibility: shoulders, wrists, hips, hamstrings' },
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
    when: 'Mon',
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
      stretch('Chest_And_Front_Of_Shoulder_Stretch', 2, 30, 'Mobility finisher. Per side. Ease in, breathe, no bouncing.'),
      stretch('Triceps_Stretch'),
      stretch('Cat_Stretch'),
    ],
  },
  {
    id: 'd1',
    label: 'Day 2 · Lower Body',
    when: 'Tue',
    focus: 'Squat, hinge, single leg, core',
    exercises: [
      ex('Barbell_Squat', 4, 5, null, { restSec: 150 }),
      ex('Romanian_Deadlift', 3, 8, null, { restSec: 120 }),
      ex('Split_Squat_with_Dumbbells', 3, 10, null, { restSec: 90, note: 'Per leg.' }),
      ex('Hanging_Leg_Raise', 3, 10, null, { unit: 'reps', restSec: 60 }),
      hold('Plank', 3, 45),
      stretch('Kneeling_Hip_Flexor', 2, 30, 'Mobility finisher. Per side. Squeeze the glute on the back leg.'),
      stretch('Standing_Hamstring_and_Calf_Stretch', 2, 30, 'Per side. A towel or band works as the strap.'),
      stretch('IT_Band_and_Glute_Stretch', 2, 30, 'Per side.'),
    ],
  },
  {
    id: 'd2',
    label: 'Day 3 · Muscle-Up Skill + Bench Volume',
    when: 'Wed',
    focus: 'Explosive pulling, transition, bench volume',
    exercises: [
      stretch('Wrist_Circles', 1, 30, 'Warm-up for false grip and dips. Do these first.'),
      stretch('Shoulder_Circles', 1, 30),
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
      ex('X_Straight_Bar_Dip', 3, 8, null, {
        unit: 'reps',
        restSec: 90,
        note: 'Jump up to the pull-up bar. This is the top half of a muscle-up. Add reps first, then a weighted vest or dumbbell between your feet.',
      }),
      stretch('Worlds_Greatest_Stretch', 2, 30, 'Mobility finisher. Per side.'),
    ],
  },
  {
    id: 'd3',
    label: 'Day 4 (optional) · Pull + Shoulders + Hips',
    when: 'Thu',
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
  {
    id: 'd4',
    label: 'Day 5 · Mobility + Flexibility',
    when: 'Fri',
    focus: 'Shoulders, wrists, hips, hamstrings',
    exercises: [
      stretch('Wrist_Circles', 1, 30, 'Easy pace all session. Breathe slowly, stay out of pain, never bounce. This is recovery before Saturday climbing.'),
      stretch('Shoulder_Circles', 1, 30),
      stretch('Cat_Stretch'),
      stretch('Chest_And_Front_Of_Shoulder_Stretch', 2, 30, 'Per side.'),
      stretch('Triceps_Stretch', 2, 30, 'Per side.'),
      stretch('Worlds_Greatest_Stretch', 2, 30, 'Per side.'),
      stretch('Kneeling_Hip_Flexor', 2, 30, 'Per side.'),
      stretch('IT_Band_and_Glute_Stretch', 2, 30, 'Per side.'),
      stretch('Standing_Hamstring_and_Calf_Stretch', 2, 30, 'Per side.'),
      stretch('Childs_Pose', 2, 45),
    ],
  },
]

export const SEED_PROGRAM: Program = {
  id: 'seed-3',
  outside: [
    { when: 'Sat', label: 'Climbing' },
    { when: 'Sun', label: 'Soccer (morning)' },
  ],
  createdAt: new Date().toISOString(),
  week: 1,
  cycleDone: 0,
  days,
  notes: [
    'Bench: your estimated max is about 185 lb (from 175 x 2), so 225 is about +40 lb. At 2 bench days per week, plan on roughly 16 to 24 weeks.',
    'Muscle-up: with 12 strict pull-ups and climbing, a first muscle-up often lands in 2 to 4 months. 10 in a row is a longer road, think 6 to 12+ months.',
    'Week layout: Mon Day 1, Tue Day 2, Wed Day 3, Thu Day 4 (optional), Fri mobility, Sat climb, Sun soccer. Friday is easy so your forearms and lats are fresh for Saturday. Legs are on Tuesday, 5 days before soccer.',
    'Mobility and flexibility are a goal of their own: a short stretch finisher on Days 1 to 3, plus a 20 minute session on Friday. Shoulder, wrist and hip range also directly help the muscle-up and your squat.',
    'Only have 3 days? Skip Day 4. It is the first thing to drop. Never move a pulling day to Friday. Do not skip the Friday mobility session.',
    'Bar dips: check the pull-up bar is anchored and rated for your weight before dipping on it. Jump up to start, lower slowly.',
    'Every 4th week is a lighter deload week (about 85% weight, fewer sets). Do not skip it.',
    'Starting weights marked blank are calibrated from the first set you log.',
  ],
}

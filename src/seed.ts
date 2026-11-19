import type { PlanDay, PlanExercise, Profile, Program, TargetUnit } from './types'

// ---------------------------------------------------------------------------
// Calisthenics program. Equipment: a doorframe pull-up bar (wide, normal,
// neutral, chin-up grips), the floor, a wall, a chair. Every 4th week deloads.
// ---------------------------------------------------------------------------

const base = (exerciseId: string, sets: number, target: number, unit: TargetUnit, restSec: number): PlanExercise => ({
  exerciseId,
  sets,
  target,
  unit,
  restSec,
  weight: null,
  missStreak: 0,
})

/** A random-variation slot. Rep targets calibrate from the first session. */
const pool = (
  label: string,
  ids: string[],
  sets: number,
  target: number,
  restSec: number,
  opts: Partial<PlanExercise> = {},
): PlanExercise => ({ ...base(ids[0], sets, target, 'reps', restSec), label, pool: ids, calibrate: true, ...opts })

/** A skill ladder. exerciseId follows the level. */
const ladder = (
  skill: string,
  ids: string[],
  level: number,
  sets: number,
  target: number,
  unit: TargetUnit,
  restSec: number,
  levelUpAt: number,
  resetTo: number,
  incr: number,
  opts: Partial<PlanExercise> = {},
): PlanExercise => ({
  ...base(ids[level], sets, target, unit, restSec),
  skill,
  ladder: ids,
  level,
  levelUpAt,
  resetTo,
  incr,
  ...opts,
})

const stretch = (id: string, sets = 2, sec = 30, note?: string): PlanExercise => ({
  ...base(id, sets, sec, 'sec', 10),
  note,
})

const warmup = (id: string, sets: number, target: number, unit: TargetUnit, note?: string): PlanExercise => ({
  ...base(id, sets, target, unit, 30),
  fixed: true,
  note,
})

// ---- ladders (shared by key across days) ----
const FL = ['X_FL_Tuck', 'X_FL_AdvTuck', 'X_FL_OneLeg', 'X_FL_Straddle']
const FL_ROW = ['X_FL_Tuck_Row', 'X_FL_AdvTuck_Row']
const HANG_CORE = ['X_Hanging_Knee_Raise', 'Hanging_Leg_Raise', 'Hanging_Pike']
const PLANCHE = ['X_Planche_Lean', 'X_Frog_Stand', 'X_Tuck_Planche', 'X_Adv_Tuck_Planche']
const PISTOL = ['X_Assisted_Pistol', 'X_Box_Pistol', 'X_Pistol']
const HOLLOW = ['X_Hollow_Tuck', 'X_Hollow_Hold']
const LSIT = ['X_Tuck_LSit', 'X_One_Leg_LSit', 'X_LSit']

// ---- random pools ----
const PULL = ['Pullups', 'X_Wide_Pullup', 'Chin-Up', 'X_Neutral_Pullup', 'Mixed_Grip_Chin']
const PULL_CHALLENGE = ['Side_To_Side_Chins', 'X_Explosive_Pullup', 'X_LSit_Pullup', 'X_Slow_Negative_Pullup']
const PUSH = ['Pushups', 'Push-Up_Wide', 'Push-Ups_-_Close_Triceps_Position', 'Decline_Push-Up', 'Clock_Push-Up']
const PUSH_CHALLENGE = ['Plyo_Push-up', 'X_Archer_Pushup', 'Clock_Push-Up']
const LEGS = ['Split_Squats', 'Crossover_Reverse_Lunge', 'Bodyweight_Walking_Lunge', 'Freehand_Jump_Squat']
const CORE = ['Reverse_Crunch', 'Dead_Bug', 'Jackknife_Sit-Up', 'Scissor_Kick']
const WILDCARD = ['Freehand_Jump_Squat', 'Mountain_Climbers', 'Jackknife_Sit-Up', 'Plyo_Push-up']
const SHOULDER_STRETCH = ['Chest_And_Front_Of_Shoulder_Stretch', 'Shoulder_Stretch', 'Triceps_Stretch', 'Upper_Back_Stretch']
const HIP_STRETCH = ['Kneeling_Hip_Flexor', 'Worlds_Greatest_Stretch', 'IT_Band_and_Glute_Stretch', 'Intermediate_Hip_Flexor_and_Quad_Stretch']

export const SEED_PROFILE: Profile = {
  goals: [
    { id: 'g1', type: 'skill', target: 'Front lever (now: tuck lever 5 to 10 s)' },
    { id: 'g2', type: 'skill', target: 'Planche' },
    { id: 'g3', type: 'strength', target: 'Core strength: L-sit, hollow body, hanging leg raises' },
    { id: 'g4', type: 'mobility', target: 'Flexibility: pike, pancake, shoulders, wrists' },
  ],
  level: 'intermediate',
  equipment: ['bodyweight'],
  daysPerWeek: 4,
  minutes: 60,
  units: 'lb',
  limits: '',
  createdAt: new Date().toISOString(),
}

const days: PlanDay[] = [
  {
    id: 'd0',
    label: 'Day 1 · Pull + Front Lever',
    when: 'Mon',
    focus: 'Front lever, pull-ups, hanging core',
    exercises: [
      warmup('Scapular_Pull-Up', 2, 10, 'reps', 'Warm-up. Shoulders down and back, arms straight.'),
      ladder('fl', FL, 0, 5, 8, 'sec', 90, 15, 6, 1, {
        label: 'Front lever hold',
        note: 'Skill first, while fresh. Flat back, straight arms. Log the seconds held with good form.',
      }),
      ladder('fl-row', FL_ROW, 0, 4, 5, 'reps', 120, 10, 4, 1, { label: 'Front lever row' }),
      pool('Pull-up (random grip)', PULL, 4, 8, 90, {
        note: 'Type the reps you actually did on the first session. That sets your target.',
      }),
      pool('Pull-up challenge (random)', PULL_CHALLENGE, 3, 4, 120),
      ladder('hang-core', HANG_CORE, 1, 3, 8, 'reps', 60, 12, 6, 1, {
        label: 'Hanging leg raise',
        note: 'If your feet hit the door frame, bend the knees.',
      }),
      stretch('Upper_Back_Stretch'),
      stretch('Childs_Pose', 2, 45),
    ],
  },
  {
    id: 'd1',
    label: 'Day 2 · Push + Planche',
    when: 'Tue',
    focus: 'Planche, pike push-ups, push-ups',
    exercises: [
      stretch('Wrist_Circles', 1, 30, 'Wrist prep. Planche work loads the wrists hard.'),
      stretch('Kneeling_Forearm_Stretch', 1, 30),
      ladder('planche', PLANCHE, 0, 4, 15, 'sec', 90, 25, 6, 2, {
        label: 'Planche',
        note: 'Skill first, while fresh. Straight arms, shoulders pushed forward past the hands.',
      }),
      { ...base('X_PPPU', 3, 6, 'reps', 90), calibrate: true },
      {
        ...base('X_Pike_Pushup_Elevated', 3, 8, 'reps', 90),
        calibrate: true,
        note: 'Shoulder strength for the planche. Feet on a chair, hips high.',
      },
      pool('Push-up (random variation)', PUSH, 3, 15, 75),
      pool('Push challenge (random)', PUSH_CHALLENGE, 2, 6, 90),
      stretch('Chest_And_Front_Of_Shoulder_Stretch', 2, 30, 'Per side.'),
    ],
  },
  {
    id: 'd2',
    label: 'Day 3 · Legs + Core',
    when: 'Wed',
    focus: 'Pistol squat, glute bridges, L-sit, hollow body',
    exercises: [
      ladder('pistol', PISTOL, 0, 4, 6, 'reps', 90, 10, 4, 1, { label: 'Pistol squat', note: 'Per leg.' }),
      pool('Legs (random)', LEGS, 3, 12, 60, { note: 'Per leg for lunges and split squats.' }),
      {
        ...base('Single_Leg_Glute_Bridge', 3, 12, 'reps', 60),
        calibrate: true,
        note: 'Hamstrings and glutes. Per leg. Drive through the heel, pause 1 s at the top.',
      },
      ladder('lsit', LSIT, 0, 4, 10, 'sec', 60, 20, 8, 2, { label: 'L-sit' }),
      ladder('hollow', HOLLOW, 1, 3, 20, 'sec', 45, 40, 15, 5, { label: 'Hollow body hold' }),
      pool('Core (random)', CORE, 3, 12, 45),
      stretch('Seated_Floor_Hamstring_Stretch', 2, 45, 'Pike flexibility. Per side.'),
      stretch('The_Straddle', 2, 45, 'Pancake flexibility.'),
    ],
  },
  {
    id: 'd3',
    label: 'Day 4 (optional) · Skills + Wildcard',
    when: 'Thu',
    focus: 'Second skill day, random fun',
    optional: true,
    exercises: [
      warmup('Scapular_Pull-Up', 1, 10, 'reps'),
      stretch('Wrist_Circles', 1, 30),
      ladder('fl', FL, 0, 4, 8, 'sec', 90, 15, 6, 1, { label: 'Front lever hold' }),
      ladder('planche', PLANCHE, 0, 3, 15, 'sec', 90, 25, 6, 2, { label: 'Planche' }),
      ladder('lsit', LSIT, 0, 3, 10, 'sec', 60, 20, 8, 2, { label: 'L-sit' }),
      pool('Pull-up (random grip)', PULL, 3, 8, 90),
      pool('Push challenge (random)', PUSH_CHALLENGE, 3, 6, 90),
      pool('Wildcard (random)', WILDCARD, 3, 10, 60, { note: 'Something different every time. Go hard, keep form.' }),
    ],
  },
  {
    id: 'd4',
    label: 'Day 5 · Flexibility + Mobility',
    when: 'Fri',
    focus: 'Pike, pancake, shoulders, wrists, hips',
    exercises: [
      stretch('Wrist_Circles', 1, 30, 'Easy pace. Breathe slowly, never bounce. Recovery before Saturday climbing.'),
      stretch('Kneeling_Forearm_Stretch', 2, 30),
      { ...pool('Shoulder stretch (random)', SHOULDER_STRETCH, 2, 30, 10, { calibrate: false }), unit: 'sec' },
      stretch('Cat_Stretch'),
      stretch('Seated_Floor_Hamstring_Stretch', 2, 45, 'Pike. Per side.'),
      stretch('The_Straddle', 2, 45, 'Pancake.'),
      { ...pool('Hip stretch (random)', HIP_STRETCH, 2, 30, 10, { calibrate: false, note: 'Per side.' }), unit: 'sec' },
      stretch('Standing_Hamstring_and_Calf_Stretch', 2, 30, 'Per side.'),
      stretch('Childs_Pose', 2, 45),
    ],
  },
]

export const SEED_PROGRAM: Program = {
  id: 'seed-6',
  outside: [
    { when: 'Sat', label: 'Climbing' },
    { when: 'Sun', label: 'Soccer (morning)' },
  ],
  createdAt: new Date().toISOString(),
  week: 1,
  cycleDone: 0,
  days,
  notes: [
    'Doorframe bar safety: front lever and L-sit pull-ups twist the bar hard. A screw-mounted bar is fine. A bar that hooks over the door trim can tip or pop off under lever torque. If yours is the hook-over kind, keep lever work tucked and test it with care.',
    'Random slots pick a new variation each workout (never the same as last time, and not repeated within a workout). Tap "Shuffle" before your first set to reroll.',
    'Skill ladders move you up automatically. Example: once your tuck front lever holds reach 15 s, you move to advanced tuck at 6 s. A level reached on one day applies to every day.',
    'Rep targets for push-up and pull-up slots start as a guess. On your first session, type what you actually did; that becomes the target.',
    'Realistic timelines: advanced tuck front lever in about 2 to 4 months; a full front lever usually takes 1 to 2+ years. Planche is the slowest skill: tuck planche in months, full planche in years.',
    'Week layout: Mon pull + front lever, Tue push + planche, Wed legs + core, Thu optional skills, Fri flexibility, Sat climb, Sun soccer. No pulling on Friday so your grip is fresh for climbing.',
    'Every 4th week is a lighter deload week (fewer sets). Do not skip it.',
  ],
}

import { EXERCISES, getExercise } from '../data/library'
import type {
  Equip,
  Exercise,
  Goal,
  GoalType,
  PlanDay,
  PlanExercise,
  Profile,
  Program,
} from '../types'

// ---------- goal weighting ----------

/** Rank 1 counts most. 1/rank, normalised so the shares sum to 1. */
export function goalShares(goals: Goal[]): Record<GoalType, number> {
  const out: Record<GoalType, number> = {
    strength: 0,
    muscle: 0,
    fatloss: 0,
    endurance: 0,
    mobility: 0,
    skill: 0,
    general: 0,
  }
  const raw = goals.map((_, i) => 1 / (i + 1))
  const total = raw.reduce((a, b) => a + b, 0) || 1
  goals.forEach((g, i) => {
    out[g.type] += raw[i] / total
  })
  return out
}

export interface Split {
  liftDays: number
  cardioDays: number
  scheme: 'strength' | 'muscle' | 'general'
  mobilityHeavy: boolean
  fatloss: boolean
  notes: string[]
}

export function planSplit(profile: Profile): Split {
  const s = goalShares(profile.goals)
  const days = Math.min(6, Math.max(2, profile.daysPerWeek))
  const notes: string[] = []

  const liftShare = s.strength + s.muscle + s.skill + s.general * 0.7 + s.fatloss * 0.5
  const cardioShare = s.endurance + s.general * 0.3 + s.fatloss * 0.5

  let cardioDays = Math.round(cardioShare * days)
  if (cardioShare > 0 && cardioDays === 0 && days >= 3) cardioDays = 1
  let liftDays = days - cardioDays

  if (liftShare === 0) {
    // endurance / mobility only: still add some strength work to support it
    liftDays = days >= 4 ? 2 : days >= 3 ? 1 : 0
    cardioDays = days - liftDays
    if (liftDays > 0) notes.push('Added strength days to support your endurance goal.')
  } else if (liftDays === 0) {
    liftDays = 1
    cardioDays = days - 1
  }
  if (cardioDays === 0 && cardioShare > 0) {
    notes.push('With this few days, cardio goals ride along as short finishers on lifting days.')
  }

  const strengthW = s.strength
  const muscleW = s.muscle
  const generalW = s.general + s.fatloss
  const scheme =
    strengthW >= muscleW && strengthW >= generalW && strengthW > 0
      ? 'strength'
      : muscleW >= generalW && muscleW > 0
        ? 'muscle'
        : 'general'

  // Flag real conflicts so the user sees the tradeoff.
  if (profile.goals.length >= 2) {
    const [top, second] = profile.goals
    const pair = new Set([top.type, second.type])
    if (pair.has('strength') && pair.has('endurance'))
      notes.push(
        'Strength and endurance compete for recovery. Your #1 goal gets the harder sessions, the other gets maintenance-level volume.',
      )
    if (pair.has('muscle') && pair.has('fatloss'))
      notes.push(
        'Building muscle while losing fat works best slowly. Expect gains in strength before the scale moves.',
      )
  }

  return {
    liftDays,
    cardioDays,
    scheme,
    mobilityHeavy: profile.goals[0]?.type === 'mobility',
    fatloss: s.fatloss > 0,
    notes,
  }
}

// ---------- equipment / limits ----------

function available(ex: Exercise, owned: Equip[]): boolean {
  if (ex.equip === 'none' || ex.equip === 'bodyweight') return true
  return owned.includes(ex.equip)
}

const LIMIT_RULES: { word: RegExp; patterns: string[]; ids: string[] }[] = [
  {
    word: /knee/i,
    patterns: ['lunge', 'quads'],
    ids: ['Rope_Jumping', 'Running_Treadmill', 'Jogging_Treadmill', 'Mountain_Climbers', 'Trail_Running_Walking'],
  },
  { word: /shoulder/i, patterns: ['vpush', 'delts'], ids: ['Bench_Dips', 'Pushups'] },
  {
    word: /(back|spine|disc)/i,
    patterns: ['hinge'],
    ids: ['Bent_Over_Barbell_Row', 'Hanging_Leg_Raise', 'Russian_Twist', 'Barbell_Squat'],
  },
  { word: /elbow/i, patterns: ['arms'], ids: ['Bench_Dips'] },
  { word: /wrist/i, patterns: [], ids: ['Pushups', 'Barbell_Curl', 'Bench_Dips'] },
  { word: /hip/i, patterns: ['lunge'], ids: [] },
]

function blockedFor(limits: string) {
  const patterns = new Set<string>()
  const ids = new Set<string>()
  for (const r of LIMIT_RULES) {
    if (r.word.test(limits)) {
      r.patterns.forEach((p) => patterns.add(p))
      r.ids.forEach((i) => ids.add(i))
    }
  }
  return { patterns, ids }
}

const EQUIP_ORDER: Equip[] = ['gym', 'dumbbell', 'kettlebell', 'bodyweight', 'bands', 'cardio-machine', 'none']

// ---------- day templates ----------

type Tier = 'main' | 'secondary' | 'accessory'
type Slot = [pattern: string, tier: Tier]

const T: Record<string, { label: string; slots: Slot[] }> = {
  fullA: {
    label: 'Full Body A',
    slots: [['squat', 'main'], ['hpush', 'secondary'], ['hpull', 'secondary'], ['glute', 'accessory'], ['core', 'accessory']],
  },
  fullB: {
    label: 'Full Body B',
    slots: [['hinge', 'main'], ['vpush', 'secondary'], ['vpull', 'secondary'], ['lunge', 'accessory'], ['core', 'accessory']],
  },
  fullC: {
    label: 'Full Body C',
    slots: [['lunge', 'main'], ['hpush', 'secondary'], ['hpull', 'secondary'], ['delts', 'accessory'], ['arms', 'accessory']],
  },
  upper: {
    label: 'Upper',
    slots: [['hpush', 'main'], ['hpull', 'main'], ['vpush', 'secondary'], ['vpull', 'secondary'], ['delts', 'accessory'], ['arms', 'accessory']],
  },
  lower: {
    label: 'Lower',
    slots: [['squat', 'main'], ['hinge', 'secondary'], ['lunge', 'accessory'], ['hamstrings', 'accessory'], ['calf', 'accessory'], ['core', 'accessory']],
  },
  push: {
    label: 'Push',
    slots: [['hpush', 'main'], ['vpush', 'secondary'], ['hpush', 'accessory'], ['delts', 'accessory'], ['arms', 'accessory']],
  },
  pull: {
    label: 'Pull',
    slots: [['vpull', 'main'], ['hpull', 'secondary'], ['delts', 'accessory'], ['arms', 'accessory'], ['core', 'accessory']],
  },
  legs: {
    label: 'Legs',
    slots: [['squat', 'main'], ['hinge', 'secondary'], ['lunge', 'accessory'], ['glute', 'accessory'], ['calf', 'accessory']],
  },
}

function dayKeys(liftDays: number): string[] {
  switch (Math.min(6, Math.max(1, liftDays))) {
    case 1:
      return ['fullA']
    case 2:
      return ['fullA', 'fullB']
    case 3:
      return ['fullA', 'fullB', 'fullC']
    case 4:
      return ['upper', 'lower', 'upper', 'lower']
    case 5:
      return ['upper', 'lower', 'push', 'pull', 'legs']
    default:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs']
  }
}

// ---------- prescriptions ----------

const SEC_IDS = new Set(['Plank', 'Mountain_Climbers'])

interface Rx {
  sets: number
  reps: number
  rest: number
}

function scheme(s: Split['scheme'], tier: Tier, level: Profile['level']): Rx {
  const table: Record<Split['scheme'], Record<Tier, Rx>> = {
    strength: {
      main: { sets: 4, reps: 5, rest: 180 },
      secondary: { sets: 3, reps: 8, rest: 120 },
      accessory: { sets: 3, reps: 10, rest: 90 },
    },
    muscle: {
      main: { sets: 4, reps: 8, rest: 120 },
      secondary: { sets: 3, reps: 10, rest: 90 },
      accessory: { sets: 3, reps: 12, rest: 60 },
    },
    general: {
      main: { sets: 3, reps: 10, rest: 90 },
      secondary: { sets: 3, reps: 12, rest: 60 },
      accessory: { sets: 3, reps: 12, rest: 60 },
    },
  }
  const rx = { ...table[s][tier] }
  if (level === 'beginner' && rx.sets > 3) rx.sets = 3
  if (level === 'advanced' && tier === 'main') rx.sets += 1
  return rx
}

function prescribe(ex: Exercise, tier: Tier, sc: Split['scheme'], level: Profile['level']): PlanExercise {
  const rx = scheme(sc, tier, level)
  const base = { exerciseId: ex.id, restSec: rx.rest, weight: null, missStreak: 0 }
  if (SEC_IDS.has(ex.id)) return { ...base, sets: 3, target: 30, unit: 'sec', restSec: 45 }
  if (ex.kind === 'core') return { ...base, sets: 3, target: 12, unit: 'reps', restSec: 45 }
  if (ex.kind === 'bodyweight') {
    const hard = ex.id === 'Pullups' || ex.id === 'Chin-Up'
    const target = hard ? (level === 'beginner' ? 3 : 6) : level === 'beginner' ? 8 : 10
    return { ...base, sets: 3, target, unit: 'reps', restSec: 90 }
  }
  return { ...base, sets: rx.sets, target: rx.reps, unit: 'reps' }
}

// ---------- building blocks ----------

interface Ctx {
  owned: Equip[]
  blockedPatterns: Set<string>
  blockedIds: Set<string>
  missing: Set<string>
}

function candidates(pattern: string, ctx: Ctx): Exercise[] {
  return EXERCISES.filter(
    (e) =>
      e.pattern === pattern &&
      available(e, ctx.owned) &&
      !ctx.blockedPatterns.has(e.pattern) &&
      !ctx.blockedIds.has(e.id),
  ).sort((a, b) => EQUIP_ORDER.indexOf(a.equip) - EQUIP_ORDER.indexOf(b.equip))
}

function pick(pattern: string, used: Set<string>, rot: number, ctx: Ctx): Exercise | null {
  const list = candidates(pattern, ctx)
  const fresh = list.filter((e) => !used.has(e.id))
  if (fresh.length === 0) {
    if (list.length === 0 && !ctx.blockedPatterns.has(pattern)) ctx.missing.add(pattern)
    return null
  }
  return fresh[rot % fresh.length]
}

function estimateMinutes(list: PlanExercise[]): number {
  let m = 5 // warm-up
  for (const p of list) {
    if (p.unit === 'min') m += p.target
    else if (p.unit === 'sec') m += p.sets * (p.target / 60 + p.restSec / 60)
    else m += p.sets * (p.restSec / 60 + 0.75)
  }
  return m
}

const STRETCH_ORDER = [
  'Worlds_Greatest_Stretch',
  'Cat_Stretch',
  'Intermediate_Hip_Flexor_and_Quad_Stretch',
  'Hamstring_Stretch',
  'Chest_And_Front_Of_Shoulder_Stretch',
  'Childs_Pose',
  'Shoulder_Stretch',
]

function mobilityFinisher(count: number, offset: number, ctx: Ctx): PlanExercise[] {
  const ids = STRETCH_ORDER.filter((id) => !ctx.blockedIds.has(id))
  const out: PlanExercise[] = []
  for (let i = 0; i < count && i < ids.length; i++) {
    out.push({
      exerciseId: ids[(offset + i) % ids.length],
      sets: 2,
      target: 30,
      unit: 'sec',
      restSec: 10,
      weight: null,
      missStreak: 0,
    })
  }
  return out
}

function cardioDay(
  idx: number,
  total: number,
  profile: Profile,
  split: Split,
  ctx: Ctx,
): PlanDay {
  const modalities = [
    'Rowing_Stationary',
    'Bicycling_Stationary',
    'Elliptical_Trainer',
    'Jogging_Treadmill',
    'Walking_Treadmill',
    'Trail_Running_Walking',
    'Rope_Jumping',
  ].filter((id) => {
    const e = getExercise(id)
    return e && available(e, ctx.owned) && !ctx.blockedIds.has(id)
  })
  const id = modalities[idx % Math.max(1, modalities.length)] ?? 'Trail_Running_Walking'
  const baseMin = profile.level === 'beginner' ? 20 : profile.level === 'intermediate' ? 30 : 40
  const minutes = Math.max(10, Math.min(baseMin, profile.minutes - 10))
  const intervals = split.fatloss && idx % 2 === 1
  const steady = !intervals
  const ex: PlanExercise = {
    exerciseId: id,
    sets: 1,
    target: minutes,
    unit: 'min',
    restSec: 0,
    weight: null,
    missStreak: 0,
    note: steady
      ? 'Easy pace. You should still be able to hold a conversation.'
      : 'Intervals: 1 min hard, 1 min easy, repeat for the whole time.',
  }
  return {
    id: `c${idx}`,
    label: total > 1 ? `Cardio ${idx + 1}` : 'Cardio',
    focus: steady ? 'Steady endurance' : 'Interval conditioning',
    exercises: [ex],
  }
}

// ---------- main entry ----------

export function generateProgram(profile: Profile, previous?: Program | null): Program {
  const split = planSplit(profile)
  const { patterns, ids } = blockedFor(profile.limits)
  const ctx: Ctx = { owned: profile.equipment, blockedPatterns: patterns, blockedIds: ids, missing: new Set() }
  const days: PlanDay[] = []
  const notes = [...split.notes]

  const keys = dayKeys(split.liftDays)
  const seen: Record<string, number> = {}
  const stretchCount = split.mobilityHeavy ? 5 : profile.goals.some((g) => g.type === 'mobility') ? 3 : 0

  keys.forEach((key, i) => {
    const t = T[key]
    const rot = seen[key] ?? 0
    seen[key] = rot + 1
    const used = new Set<string>()
    const list: PlanExercise[] = []
    for (const [pattern, tier] of t.slots) {
      const ex = pick(pattern, used, rot, ctx)
      if (!ex) continue
      used.add(ex.id)
      list.push(prescribe(ex, tier, split.scheme, profile.level))
    }
    // Time budget: trim accessories from the end, keep at least 3 lifts.
    const finisherMin = (split.fatloss && split.cardioDays === 0 ? 8 : 0) + stretchCount * 1.2
    while (list.length > 3 && estimateMinutes(list) + finisherMin > profile.minutes) list.pop()

    if (split.fatloss && split.cardioDays < Math.ceil(profile.daysPerWeek / 2)) {
      const conditioning = pick('cardio', new Set(), i, ctx)
      if (conditioning) {
        list.push({
          exerciseId: conditioning.id,
          sets: 1,
          target: 8,
          unit: 'min',
          restSec: 0,
          weight: null,
          missStreak: 0,
          note: 'Finisher: keep it hard but steady.',
        })
      }
    }
    list.push(...mobilityFinisher(stretchCount, i * 2, ctx))
    days.push({
      id: `l${i}`,
      label: `${t.label}`,
      focus: t.slots
        .map(([p]) => p)
        .filter((p, j, a) => a.indexOf(p) === j)
        .slice(0, 3)
        .join(' · '),
      exercises: list,
    })
  })

  for (let i = 0; i < split.cardioDays; i++) {
    const d = cardioDay(i, split.cardioDays, profile, split, ctx)
    d.exercises.push(...mobilityFinisher(stretchCount, i, ctx))
    days.push(d)
  }

  // Interleave so hard days aren't back to back: alternate lift / cardio.
  const lifts = days.filter((d) => d.id.startsWith('l'))
  const cardios = days.filter((d) => d.id.startsWith('c'))
  const ordered: PlanDay[] = []
  while (lifts.length || cardios.length) {
    if (lifts.length) ordered.push(lifts.shift()!)
    if (cardios.length && (ordered.length % 2 === 0 || !lifts.length)) ordered.push(cardios.shift()!)
  }
  ordered.forEach((d, i) => {
    d.id = `d${i}`
    d.label = `Day ${i + 1} · ${d.label}`
  })

  if (ctx.missing.size > 0) {
    notes.push(
      `Your equipment has no option for: ${[...ctx.missing].join(', ')}. Adding bands, dumbbells or a pull-up bar would fill those gaps.`,
    )
  }
  if (profile.limits.trim()) {
    notes.push(
      'Limits are matched by keyword (knee, shoulder, back, elbow, wrist, hip). Run "Export for trainer" so I can review the plan against your exact situation.',
    )
  }

  // Carry weights over from the previous program so changing goals doesn't reset your numbers.
  if (previous) {
    const known = new Map<string, number>()
    for (const d of previous.days)
      for (const e of d.exercises) if (e.weight != null) known.set(e.exerciseId, e.weight)
    for (const d of ordered) for (const e of d.exercises) if (e.weight == null && known.has(e.exerciseId)) e.weight = known.get(e.exerciseId)!
  }

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    week: previous?.week ?? 1,
    cycleDone: 0,
    days: ordered,
    notes,
  }
}

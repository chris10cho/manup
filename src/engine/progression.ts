import type { Equip, Feedback, PlanExercise, SetLog, Units } from '../types'

export const DELOAD_EVERY = 4

export function isDeloadWeek(week: number): boolean {
  return week > 0 && week % DELOAD_EVERY === 0
}

/** Smallest practical jump for this kind of load. */
export function increment(equip: Equip, pattern: string, units: Units): number {
  const lowerBig = pattern === 'squat' || pattern === 'hinge' || pattern === 'glute'
  if (units === 'lb') {
    if (equip === 'gym') return lowerBig ? 10 : 5
    if (equip === 'dumbbell' || equip === 'kettlebell') return 5
    return 5
  }
  if (equip === 'gym') return lowerBig ? 5 : 2.5
  if (equip === 'dumbbell' || equip === 'kettlebell') return 2
  return 2.5
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/** Weight shown for a session. Deload weeks use 85% and fewer sets. */
export function displayWeight(
  base: number | null,
  week: number,
  step: number,
): number | null {
  if (base == null) return null
  if (!isDeloadWeek(week)) return base
  return Math.max(step, roundTo(base * 0.85, step))
}

export function displaySets(sets: number, week: number): number {
  if (!isDeloadWeek(week)) return sets
  return Math.max(1, Math.round(sets * 0.6))
}

export interface ProgressionResult {
  next: PlanExercise
  /** human readable line for the summary screen, or null if nothing changed */
  message: string | null
}

const STEP_BY_UNIT = { reps: 1, sec: 5, min: 2 } as const
/** Holds stop growing here. Past a minute or so, add difficulty instead of time. */
export const MAX_HOLD_SEC = 90

/**
 * Decide the next prescription for one exercise from what happened this session.
 * Rules:
 *  - not calibrated yet: heaviest completed weight becomes the base
 *  - deload week: never change the base
 *  - hit every target -> add weight (or reps/time if no load); "hard" feedback holds
 *  - "easy" and hit everything -> double jump
 *  - missed once -> hold; missed twice in a row -> drop ~10%
 */
export function progress(
  ex: PlanExercise,
  logged: SetLog[],
  feedback: Feedback | undefined,
  week: number,
  step: number,
  name: string,
): ProgressionResult {
  const done = logged.filter((s) => s.done)
  if (done.length === 0) return { next: ex, message: null }

  // First time with a load: calibrate from what the user actually used.
  if (ex.unit === 'reps' && ex.weight == null) {
    const used = done.map((s) => s.weight).filter((w): w is number => w != null && w > 0)
    if (used.length > 0) {
      const w = Math.max(...used)
      return {
        next: { ...ex, weight: w, missStreak: 0 },
        message: `${name}: starting weight set to ${w}`,
      }
    }
  }

  if (isDeloadWeek(week)) return { next: ex, message: null }

  const hitAll =
    done.length >= displaySets(ex.sets, week) && done.every((s) => s.actual >= s.target)

  if (hitAll) {
    const bump = feedback === 'easy' ? 2 : 1
    if (feedback === 'hard') {
      return { next: { ...ex, missStreak: 0 }, message: `${name}: hold (felt hard)` }
    }
    if (ex.weight != null) {
      const w = ex.weight + step * bump
      return {
        next: { ...ex, weight: w, missStreak: 0 },
        message: `${name}: ${ex.weight} -> ${w}`,
      }
    }
    // no load: add reps / seconds / minutes
    const inc = STEP_BY_UNIT[ex.unit] * bump
    const t = ex.unit === 'sec' ? Math.min(MAX_HOLD_SEC, ex.target + inc) : ex.target + inc
    if (t === ex.target) return { next: { ...ex, missStreak: 0 }, message: `${name}: hold at ${t} ${ex.unit}` }
    return {
      next: { ...ex, target: t, missStreak: 0 },
      message: `${name}: ${ex.target} -> ${t} ${ex.unit}`,
    }
  }

  // missed
  const streak = ex.missStreak + 1
  if (streak >= 2 && ex.weight != null) {
    const w = Math.max(step, roundTo(ex.weight * 0.9, step))
    return {
      next: { ...ex, weight: w, missStreak: 0 },
      message: `${name}: ${ex.weight} -> ${w} (reset after 2 misses)`,
    }
  }
  if (streak >= 2 && ex.weight == null && ex.target > STEP_BY_UNIT[ex.unit]) {
    const t = Math.max(1, ex.target - STEP_BY_UNIT[ex.unit])
    return {
      next: { ...ex, target: t, missStreak: 0 },
      message: `${name}: ${ex.target} -> ${t} ${ex.unit} (reset after 2 misses)`,
    }
  }
  return { next: { ...ex, missStreak: streak }, message: `${name}: hold, try again` }
}

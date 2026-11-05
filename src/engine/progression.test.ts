import { describe, expect, it } from 'vitest'
import type { PlanExercise, SetLog } from '../types'
import { displaySets, displayWeight, increment, isDeloadWeek, progress } from './progression'

const base: PlanExercise = {
  exerciseId: 'x',
  sets: 3,
  target: 5,
  unit: 'reps',
  restSec: 120,
  weight: 100,
  missStreak: 0,
}

function sets(actuals: number[], weight: number | null, target = 5): SetLog[] {
  return actuals.map((a, i) => ({
    exerciseId: 'x',
    setIndex: i,
    target,
    actual: a,
    weight,
    done: true,
  }))
}

describe('progress', () => {
  it('adds one step when every target is hit', () => {
    const r = progress(base, sets([5, 5, 5], 100), 'ok', 1, 5, 'Squat')
    expect(r.next.weight).toBe(105)
    expect(r.next.missStreak).toBe(0)
  })

  it('doubles the jump when it felt easy', () => {
    const r = progress(base, sets([5, 5, 5], 100), 'easy', 1, 5, 'Squat')
    expect(r.next.weight).toBe(110)
  })

  it('holds when it felt hard even if reps were hit', () => {
    const r = progress(base, sets([5, 5, 5], 100), 'hard', 1, 5, 'Squat')
    expect(r.next.weight).toBe(100)
  })

  it('holds on the first miss and counts it', () => {
    const r = progress(base, sets([5, 4, 3], 100), 'ok', 1, 5, 'Squat')
    expect(r.next.weight).toBe(100)
    expect(r.next.missStreak).toBe(1)
  })

  it('drops about 10% after two misses in a row', () => {
    const r = progress({ ...base, missStreak: 1 }, sets([4, 4, 3], 100), 'ok', 1, 5, 'Squat')
    expect(r.next.weight).toBe(90)
    expect(r.next.missStreak).toBe(0)
  })

  it('counts an unfinished session (fewer sets than prescribed) as a miss', () => {
    const r = progress(base, sets([5, 5], 100), 'ok', 1, 5, 'Squat')
    expect(r.next.weight).toBe(100)
    expect(r.next.missStreak).toBe(1)
  })

  it('does nothing when no sets were completed', () => {
    const r = progress(base, [], 'ok', 1, 5, 'Squat')
    expect(r.next).toEqual(base)
    expect(r.message).toBeNull()
  })

  it('calibrates the base weight from the heaviest logged set on first use', () => {
    const r = progress({ ...base, weight: null }, sets([5, 5, 5], 80), 'ok', 1, 5, 'Squat')
    expect(r.next.weight).toBe(80)
  })

  it('never changes the base weight in a deload week', () => {
    const r = progress(base, sets([5, 5], 85), 'ok', 4, 5, 'Squat')
    expect(r.next.weight).toBe(100)
  })

  it('progresses reps for bodyweight work', () => {
    const pushups: PlanExercise = { ...base, weight: null, target: 10, unit: 'reps', missStreak: 0 }
    // weight null + reps unit + no weights logged -> not calibration (no weight used)
    const r = progress(pushups, sets([10, 10, 10], null, 10), 'ok', 1, 5, 'Push-ups')
    expect(r.next.target).toBe(11)
  })

  it('progresses plank seconds in 5s steps', () => {
    const plank: PlanExercise = { ...base, weight: null, target: 30, unit: 'sec' }
    const r = progress(plank, sets([30, 30, 30], null, 30), 'ok', 1, 5, 'Plank')
    expect(r.next.target).toBe(35)
  })
})

describe('deload', () => {
  it('flags every 4th week', () => {
    expect([1, 2, 3, 4, 5, 8].map(isDeloadWeek)).toEqual([false, false, false, true, false, true])
  })

  it('lowers weight to ~85% on a step and trims sets', () => {
    expect(displayWeight(100, 4, 5)).toBe(85)
    expect(displayWeight(100, 3, 5)).toBe(100)
    expect(displayWeight(null, 4, 5)).toBeNull()
    expect(displaySets(5, 4)).toBe(3)
    expect(displaySets(3, 2)).toBe(3)
  })
})

describe('increment', () => {
  it('uses bigger jumps for barbell lower body', () => {
    expect(increment('gym', 'squat', 'lb')).toBe(10)
    expect(increment('gym', 'hpush', 'lb')).toBe(5)
    expect(increment('gym', 'squat', 'kg')).toBe(5)
    expect(increment('dumbbell', 'hpush', 'kg')).toBe(2)
  })
})

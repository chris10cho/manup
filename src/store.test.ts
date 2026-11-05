import { describe, expect, it } from 'vitest'
import { freshState, migrate, nextDay } from './store'
import { SEED_PROFILE, SEED_PROGRAM } from './seed'
import { getExercise } from './data/library'

describe('migrate', () => {
  it('keeps weights and week when the built-in program is replaced', () => {
    const s = freshState()
    const oldDays = s.program.days.map((d) => ({
      ...d,
      exercises: d.exercises.map((e) =>
        e.exerciseId === 'Barbell_Bench_Press_-_Medium_Grip' && d.id === 'd0' ? { ...e, weight: 185 } : e,
      ),
    }))
    const stale = { ...s, program: { ...s.program, id: 'seed-1', week: 3, days: oldDays } }
    const out = migrate(stale)
    expect(out.program.id).toBe(SEED_PROGRAM.id)
    expect(out.program.week).toBe(3)
    expect(out.program.days[0].exercises[0].weight).toBe(185)
    expect(out.program.days[2].exercises.some((e) => e.exerciseId === 'X_Straight_Bar_Dip')).toBe(true)
  })
  it('leaves a trainer-imported program alone', () => {
    const s = freshState()
    const custom = { ...s, program: { ...s.program, id: 'abc-123' } }
    expect(migrate(custom)).toBe(custom)
  })
  it('does nothing when already current', () => {
    const s = freshState()
    expect(migrate(s)).toBe(s)
  })
})

describe('nextDay', () => {
  const at = (d: number) => new Date(2026, 10, d) // Nov 2026: 2=Mon 3=Tue 4=Wed 5=Thu 6=Fri 7=Sat
  it('suggests the day planned for today', () => {
    const s = freshState()
    expect(nextDay(s, at(2))?.when).toBe('Mon')
    expect(nextDay(s, at(5))?.when).toBe('Thu')
    expect(nextDay(s, at(6))?.when).toBe('Fri')
  })
  it('falls back to the first required day on a day with no workout', () => {
    expect(nextDay(freshState(), at(7))?.when).toBe('Mon')
  })
  it('skips optional Thursday when nothing is planned and required days remain', () => {
    expect(nextDay(freshState(), at(8))?.optional).toBeFalsy()
  })
})

describe('built-in program', () => {
  it('has mobility as a goal and a Friday mobility day', () => {
    expect(SEED_PROFILE.goals.some((g) => g.type === 'mobility')).toBe(true)
    const fri = SEED_PROGRAM.days.find((d) => d.when === 'Fri')!
    expect(fri.optional).toBeFalsy()
    expect(fri.exercises.length).toBeGreaterThanOrEqual(8)
    expect(fri.exercises.every((e) => getExercise(e.exerciseId)?.kind === 'mobility')).toBe(true)
  })
  it('only references exercises that exist in the library', () => {
    for (const d of SEED_PROGRAM.days)
      for (const e of d.exercises) expect(getExercise(e.exerciseId), e.exerciseId).toBeDefined()
  })
  it('migration brings in the new goals', () => {
    const s = freshState()
    const stale = { ...s, profile: { ...s.profile, goals: s.profile.goals.slice(0, 2) }, program: { ...s.program, id: 'seed-2' } }
    expect(migrate(stale).profile.goals).toHaveLength(3)
  })
})

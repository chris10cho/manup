import { describe, expect, it } from 'vitest'
import { freshState, migrate } from './store'
import { SEED_PROGRAM } from './seed'

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

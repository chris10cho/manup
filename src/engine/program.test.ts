import { describe, expect, it } from 'vitest'
import { generateProgram, goalShares } from './program'
import type { Profile } from '../types'

const p = (over: Partial<Profile> = {}): Profile => ({
  goals: [{ id: '1', type: 'strength' }, { id: '2', type: 'endurance' }, { id: '3', type: 'mobility' }],
  level: 'intermediate', equipment: ['gym', 'dumbbell', 'cardio-machine'],
  daysPerWeek: 4, minutes: 60, units: 'lb', limits: '', createdAt: '', ...over,
})

describe('generateProgram', () => {
  it('shares sum to 1 and rank 1 is biggest', () => {
    const s = goalShares(p().goals)
    expect(s.strength + s.endurance + s.mobility).toBeCloseTo(1)
    expect(s.strength).toBeGreaterThan(s.endurance)
  })
  it('makes one day per training day, with a cardio day for the endurance goal', () => {
    const prog = generateProgram(p())
    expect(prog.days).toHaveLength(4)
    expect(prog.days.some((d) => d.focus.includes('endurance'))).toBe(true)
  })
  it('respects a knee limit', () => {
    const prog = generateProgram(p({ limits: 'bad knee' }))
    const ids = prog.days.flatMap((d) => d.exercises.map((e) => e.exerciseId))
    expect(ids).not.toContain('Dumbbell_Lunges')
    expect(ids).not.toContain('Jogging_Treadmill')
  })
  it('works with bodyweight only', () => {
    const prog = generateProgram(p({ equipment: ['bodyweight'], daysPerWeek: 3 }))
    expect(prog.days).toHaveLength(3)
    expect(prog.days.every((d) => d.exercises.length > 0)).toBe(true)
  })
})

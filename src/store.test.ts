import { describe, expect, it } from 'vitest'
import { applyFinish, buildSession, freshState, migrate, nextDay, rerollSlot } from './store'
import { SEED_PROFILE, SEED_PROGRAM } from './seed'
import { getExercise } from './data/library'
import { pickVariation } from './engine/variation'
import type { AppState } from './db'
import type { Session } from './types'

/** Deterministic rng that walks through the given values. */
const seq = (...v: number[]) => {
  let i = 0
  return () => v[i++ % v.length]
}

/** Start a day and tick every set with the given actual value per slot (default: target). */
function doDay(s: AppState, dayId: string, actual?: (slot: number, target: number) => number, rng = seq(0)) {
  const session = buildSession(s, dayId, rng)
  session.sets = session.sets.map((x) => ({ ...x, done: true, actual: actual ? actual(x.slot, x.target) : x.target }))
  return applyFinish({ ...s, active: session }, 'ok')
}

describe('migrate', () => {
  it('wipes anything saved by the old gym program (version 1)', () => {
    const old = { ...freshState(), version: 1, sessions: [{ id: 'x' } as Session] } as unknown as AppState
    const out = migrate(old)
    expect(out.sessions).toHaveLength(0)
    expect(out.program.id).toBe(SEED_PROGRAM.id)
    expect(out.version).toBe(2)
  })
  it('carries ladder level and targets per slot when a newer built-in program arrives', () => {
    const s = freshState()
    const days = s.program.days.map((d) =>
      d.id === 'd0'
        ? { ...d, exercises: d.exercises.map((e) => (e.skill === 'fl' ? { ...e, level: 1, exerciseId: e.ladder![1], target: 9 } : e)) }
        : d,
    )
    const stale = { ...s, program: { ...s.program, id: 'seed-3', week: 3, days } }
    const out = migrate(stale)
    const fl = out.program.days[0].exercises.find((e) => e.skill === 'fl')!
    expect(out.program.id).toBe(SEED_PROGRAM.id)
    expect(out.program.week).toBe(3)
    expect(fl.level).toBe(1)
    expect(fl.target).toBe(9)
  })
  it('leaves a trainer-imported program alone and does nothing when current', () => {
    const s = freshState()
    const custom = { ...s, program: { ...s.program, id: 'abc-123' } }
    expect(migrate(custom)).toBe(custom)
    expect(migrate(s)).toBe(s)
  })
})

describe('nextDay', () => {
  const at = (d: number) => new Date(2026, 10, d) // Nov 2026: 2=Mon ... 6=Fri 7=Sat
  it('suggests the day planned for today, else the first required day', () => {
    const s = freshState()
    expect(nextDay(s, at(2))?.when).toBe('Mon')
    expect(nextDay(s, at(5))?.when).toBe('Thu')
    expect(nextDay(s, at(6))?.when).toBe('Fri')
    expect(nextDay(s, at(7))?.when).toBe('Mon')
  })
})

describe('built-in calisthenics program', () => {
  it('only references exercises that exist (including pools and ladders)', () => {
    for (const d of SEED_PROGRAM.days)
      for (const e of d.exercises)
        for (const id of [e.exerciseId, ...(e.pool ?? []), ...(e.ladder ?? [])])
          expect(getExercise(id), `${d.id}: ${id}`).toBeDefined()
  })
  it('has the four new goals and needs only bodyweight', () => {
    expect(SEED_PROFILE.goals).toHaveLength(4)
    expect(SEED_PROFILE.equipment).toEqual(['bodyweight'])
    for (const d of SEED_PROGRAM.days)
      for (const e of d.exercises) expect(getExercise(e.exerciseId)?.kind, e.exerciseId).not.toBe('lift')
  })
  it('keeps Friday as stretching only (no pulling before Saturday climbing)', () => {
    const fri = SEED_PROGRAM.days.find((d) => d.when === 'Fri')!
    for (const e of fri.exercises)
      for (const id of [e.exerciseId, ...(e.pool ?? [])]) expect(getExercise(id)?.kind).toBe('mobility')
  })
  it('ladder exerciseId matches its level', () => {
    for (const d of SEED_PROGRAM.days)
      for (const e of d.exercises) if (e.ladder) expect(e.exerciseId).toBe(e.ladder[e.level ?? 0])
  })
})

describe('random variations', () => {
  it('pickVariation avoids the given ids when it can', () => {
    expect(pickVariation(['a', 'b', 'c'], new Set(['a', 'b']), seq(0.99))).toBe('c')
    expect(pickVariation(['a'], new Set(['a']), seq(0))).toBe('a')
  })
  it('never repeats last time\'s pick for a slot', () => {
    let s = freshState()
    const pullSlot = s.program.days[0].exercises.findIndex((e) => e.label === 'Pull-up (random grip)')
    const first = buildSession(s, 'd0', seq(0)).sets.find((x) => x.slot === pullSlot)!.exerciseId
    s = doDay(s, 'd0', undefined, seq(0)).state
    for (let i = 0; i < 20; i++) {
      const pick = buildSession(s, 'd0', seq(i / 20)).sets.find((x) => x.slot === pullSlot)!.exerciseId
      expect(pick).not.toBe(first)
    }
  })
  it('does not use the same variation twice in one workout', () => {
    const s = freshState()
    for (let i = 0; i < 20; i++) {
      const session = buildSession(s, 'd3', seq(i / 20))
      const picks = [...new Set(session.sets.map((x) => `${x.slot}:${x.exerciseId}`))].map((k) => k.split(':')[1])
      expect(new Set(picks).size).toBe(picks.length)
    }
  })
  it('Shuffle swaps a slot until a set is ticked', () => {
    const s = freshState()
    const slot = s.program.days[0].exercises.findIndex((e) => e.pool)
    const active = buildSession(s, 'd0', seq(0))
    const before = active.sets.find((x) => x.slot === slot)!.exerciseId
    const after = rerollSlot({ ...s, active }, slot, seq(0)).active!.sets.find((x) => x.slot === slot)!.exerciseId
    expect(after).not.toBe(before)
    const ticked = { ...active, sets: active.sets.map((x) => (x.slot === slot && x.setIndex === 0 ? { ...x, done: true } : x)) }
    const locked = rerollSlot({ ...s, active: ticked }, slot, seq(0)).active!.sets.find((x) => x.slot === slot)!.exerciseId
    expect(locked).toBe(before)
  })
})

describe('finishing calisthenics sessions', () => {
  it('calibrates a pool slot from the first session, then progresses by 1 rep', () => {
    let s = freshState()
    const slot = s.program.days[0].exercises.findIndex((e) => e.label === 'Pull-up (random grip)')
    s = doDay(s, 'd0', (sl, t) => (sl === slot ? 11 : t)).state
    expect(s.program.days[0].exercises[slot].target).toBe(11)
    expect(s.program.days[0].exercises[slot].calibrate).toBe(false)
    s = doDay(s, 'd0').state
    expect(s.program.days[0].exercises[slot].target).toBe(12)
  })
  it('levels up a ladder and applies the new level to the same skill on other days', () => {
    let s = freshState()
    const flSlot = s.program.days[0].exercises.findIndex((e) => e.skill === 'fl')
    // set Monday's tuck lever target just below the level-up point
    s = {
      ...s,
      program: {
        ...s.program,
        days: s.program.days.map((d) =>
          d.id === 'd0' ? { ...d, exercises: d.exercises.map((e, i) => (i === flSlot ? { ...e, target: 14 } : e)) } : d,
        ),
      },
    }
    const r = doDay(s, 'd0')
    const mon = r.state.program.days[0].exercises[flSlot]
    expect(mon.level).toBe(1)
    expect(mon.exerciseId).toBe('X_FL_AdvTuck')
    expect(mon.target).toBe(6)
    expect(r.lines.some((l) => l.startsWith('Level up'))).toBe(true)
    const thu = r.state.program.days.find((d) => d.id === 'd3')!.exercises.find((e) => e.skill === 'fl')!
    expect(thu.level).toBe(1)
    expect(thu.exerciseId).toBe('X_FL_AdvTuck')
  })
  it('does not progress warm-ups or stretches', () => {
    const s = freshState()
    const r = doDay(s, 'd0')
    const before = s.program.days[0].exercises
    const after = r.state.program.days[0].exercises
    before.forEach((e, i) => {
      if (e.fixed || getExercise(e.exerciseId)?.kind === 'mobility') expect(after[i]).toEqual(e)
    })
  })
})

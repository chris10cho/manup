import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { type AppState, loadState, requestPersistence, saveState } from './db'
import { getExercise } from './data/library'
import { displaySets, displayWeight, increment, isDeloadWeek, progress } from './engine/progression'
import { pickVariation } from './engine/variation'
import { SEED_PROFILE, SEED_PROGRAM } from './seed'
import type { Feedback, PlanDay, PlanExercise, Program, Session, SetLog } from './types'

export const STATE_VERSION = 2

export function freshState(): AppState {
  return {
    version: STATE_VERSION,
    profile: SEED_PROFILE,
    program: SEED_PROGRAM,
    sessions: [],
    active: null,
    videos: {},
    bodyweight: [],
  }
}

/** Fields of a slot that carry the user's progress (kept when the built-in program is updated). */
function carryProgress(fresh: PlanExercise, old: PlanExercise | undefined): PlanExercise {
  if (!old) return fresh
  // Only carry over if the slot is still the same kind of thing (same pool / ladder / exercise).
  const same =
    (fresh.ladder && old.ladder && fresh.ladder.join() === old.ladder.join()) ||
    (fresh.pool && old.pool && fresh.pool.join() === old.pool.join()) ||
    (!fresh.ladder && !fresh.pool && fresh.exerciseId === old.exerciseId)
  if (!same) return fresh
  return {
    ...fresh,
    target: old.target,
    weight: old.weight,
    level: old.level,
    exerciseId: old.exerciseId,
    calibrate: old.calibrate,
    missStreak: old.missStreak,
  }
}

/**
 * Loading saved data:
 * - anything saved before the calisthenics program (version < 2) is wiped, as the user asked
 * - an older built-in program (seed-N) is replaced by the current one, keeping progress per slot
 * - programs imported from the trainer (non-seed ids) are left alone
 */
export function migrate(s: AppState): AppState {
  if ((s.version ?? 1) < STATE_VERSION) return freshState()
  const old = s.program
  if (!old.id.startsWith('seed-') || old.id === SEED_PROGRAM.id) return s
  const days = SEED_PROGRAM.days.map((d) => {
    const prev = old.days.find((x) => x.id === d.id)
    return { ...d, exercises: d.exercises.map((e, i) => carryProgress(e, prev?.exercises[i])) }
  })
  return {
    ...s,
    profile: { ...s.profile, goals: SEED_PROFILE.goals },
    program: { ...SEED_PROGRAM, days, week: old.week },
    active: null,
  }
}

export function stepFor(exerciseId: string, units: 'lb' | 'kg'): number {
  const e = getExercise(exerciseId)
  return e ? increment(e.equip, e.pattern, units) : 5
}

export function finishedThisWeek(s: AppState): Set<string> {
  return new Set(s.sessions.filter((x) => x.finished && x.week === s.program.week).map((x) => x.dayId))
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * What to suggest now: today's planned day if it is not done, else the first required day
 * not done yet, else an optional one.
 */
export function nextDay(s: AppState, now: Date = new Date()): PlanDay | null {
  const done = finishedThisWeek(s)
  const left = s.program.days.filter((d) => !done.has(d.id))
  const today = WEEKDAYS[now.getDay()]
  return left.find((d) => d.when === today) ?? left.find((d) => !d.optional) ?? left[0] ?? null
}

export function weekComplete(s: AppState): boolean {
  const done = finishedThisWeek(s)
  return s.program.days.filter((d) => !d.optional).every((d) => done.has(d.id))
}

/** The variation used for a slot the last time this day was trained. */
function lastPick(s: AppState, dayId: string, slot: number): string | undefined {
  for (let i = s.sessions.length - 1; i >= 0; i--) {
    const x = s.sessions[i]
    if (x.dayId !== dayId) continue
    return x.sets.find((set) => set.slot === slot)?.exerciseId
  }
  return undefined
}

function setsFor(pe: PlanExercise, slot: number, exerciseId: string, week: number, units: 'lb' | 'kg'): SetLog[] {
  const n = displaySets(pe.sets, week)
  const w = displayWeight(pe.weight, week, stepFor(exerciseId, units))
  return Array.from({ length: n }, (_, i) => ({
    slot,
    exerciseId,
    setIndex: i,
    target: pe.target,
    actual: pe.target,
    weight: w,
    done: false,
  }))
}

/** Start a day: random slots get a variation different from last time and from each other. */
export function buildSession(s: AppState, dayId: string, rng: () => number = Math.random): Session {
  const day = s.program.days.find((d) => d.id === dayId)!
  const usedToday = new Set<string>()
  const sets: SetLog[] = []
  day.exercises.forEach((pe, slot) => {
    let id = pe.exerciseId
    if (pe.pool?.length) {
      const avoid = new Set(usedToday)
      const last = lastPick(s, dayId, slot)
      if (last) avoid.add(last)
      id = pickVariation(pe.pool, avoid, rng)
    }
    usedToday.add(id)
    sets.push(...setsFor(pe, slot, id, s.program.week, s.profile.units))
  })
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    dayId,
    dayLabel: day.label,
    week: s.program.week,
    sets,
    finished: false,
  }
}

/** Swap a random slot to another variation (only before any of its sets are ticked). */
export function rerollSlot(s: AppState, slot: number, rng: () => number = Math.random): AppState {
  const act = s.active
  if (!act) return s
  const day = s.program.days.find((d) => d.id === act.dayId)
  const pe = day?.exercises[slot]
  if (!pe?.pool || pe.pool.length < 2) return s
  const mine = act.sets.filter((x) => x.slot === slot)
  if (mine.some((x) => x.done)) return s
  const avoid = new Set(act.sets.map((x) => x.exerciseId)) // current pick and everything else today
  const id = pickVariation(pe.pool, avoid, rng)
  return {
    ...s,
    active: { ...act, sets: act.sets.map((x) => (x.slot === slot ? { ...x, exerciseId: id } : x)) },
  }
}

/** Finish the active session: progress every slot and share skill levels across days. */
export function applyFinish(s: AppState, feedback: Feedback): { state: AppState; lines: string[] } {
  const lines: string[] = []
  const act = s.active
  if (!act) return { state: s, lines }
  // Nothing ticked: do not record a workout that did not happen.
  if (!act.sets.some((x) => x.done)) return { state: { ...s, active: null }, lines }
  const day = s.program.days.find((d) => d.id === act.dayId)!
  const deload = isDeloadWeek(act.week)
  const exercises = day.exercises.map((pe, slot) => {
    const logged = act.sets.filter((x) => x.slot === slot)
    const usedId = logged[0]?.exerciseId ?? pe.exerciseId
    const ex = getExercise(usedId)
    // Stretches and mobility drills are done for quality, not progressed.
    if (ex?.kind === 'mobility' || pe.fixed) return pe
    const used = logged.filter((x) => x.done && x.weight != null && x.weight > 0).map((x) => x.weight as number)
    const base = !deload && pe.weight != null && used.length ? { ...pe, weight: Math.max(...used) } : pe
    const name = pe.label ?? ex?.name ?? usedId
    const r = progress(base, logged, feedback, act.week, stepFor(usedId, s.profile.units), name, ex?.kind === 'lift')
    if (r.message) lines.push(r.message)
    return r.next
  })
  // A skill level reached on one day applies to the same skill on every other day.
  const skills = new Map(exercises.filter((e) => e.skill).map((e) => [e.skill!, e]))
  const days = s.program.days.map((d) => {
    if (d.id === day.id) return { ...d, exercises }
    return {
      ...d,
      exercises: d.exercises.map((e) => {
        const src = e.skill ? skills.get(e.skill) : undefined
        if (!src || (src.level ?? 0) <= (e.level ?? 0)) return e
        return { ...e, level: src.level, exerciseId: src.exerciseId, target: e.resetTo ?? src.target, missStreak: 0 }
      }),
    }
  })
  const finished: Session = { ...act, feedback, finished: true }
  return {
    state: { ...s, active: null, sessions: [...s.sessions, finished], program: { ...s.program, days } },
    lines,
  }
}

interface Store {
  state: AppState
  /** begin (or resume) a day */
  start: (dayId: string) => void
  discard: () => void
  updateSet: (slot: number, setIndex: number, patch: Partial<SetLog>) => void
  reroll: (slot: number) => void
  finish: (feedback: Feedback) => string[]
  nextWeek: () => void
  setVideo: (exerciseId: string, url: string | null) => void
  addBodyweight: (value: number) => void
  replace: (s: AppState) => void
  importProgram: (p: Program) => void
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('no store')
  return v
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null)
  const ready = useRef(false)

  useEffect(() => {
    loadState().then((s) => {
      setState(s ? migrate(s) : freshState())
      ready.current = true
    })
    requestPersistence()
  }, [])

  useEffect(() => {
    if (state && ready.current) saveState(state)
  }, [state])

  const mut = useCallback((fn: (s: AppState) => AppState) => setState((s) => (s ? fn(s) : s)), [])

  const store = useMemo<Store | null>(() => {
    if (!state) return null
    return {
      state,
      start(dayId) {
        mut((s) => (s.active && s.active.dayId === dayId ? s : { ...s, active: buildSession(s, dayId) }))
      },
      discard() {
        mut((s) => ({ ...s, active: null }))
      },
      updateSet(slot, setIndex, patch) {
        mut((s) =>
          !s.active
            ? s
            : {
                ...s,
                active: {
                  ...s.active,
                  sets: s.active.sets.map((x) => (x.slot === slot && x.setIndex === setIndex ? { ...x, ...patch } : x)),
                },
              },
        )
      },
      reroll(slot) {
        mut((s) => rerollSlot(s, slot))
      },
      finish(feedback) {
        const r = applyFinish(state, feedback)
        setState(r.state)
        return r.lines
      },
      nextWeek() {
        mut((s) => ({ ...s, program: { ...s.program, week: s.program.week + 1 } }))
      },
      setVideo(id, url) {
        mut((s) => {
          const videos = { ...s.videos }
          if (url) videos[id] = url
          else delete videos[id]
          return { ...s, videos }
        })
      },
      addBodyweight(value) {
        mut((s) => ({ ...s, bodyweight: [...s.bodyweight, { date: new Date().toISOString(), value }] }))
      },
      replace(next) {
        setState(migrate(next))
      },
      importProgram(p) {
        mut((s) => ({ ...s, program: p, active: null }))
      },
    }
  }, [state, mut])

  if (!store) return <div className="p-6 text-muted">Loading…</div>
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

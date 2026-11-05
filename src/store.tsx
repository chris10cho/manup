import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { type AppState, loadState, requestPersistence, saveState } from './db'
import { getExercise } from './data/library'
import { displaySets, displayWeight, increment, isDeloadWeek, progress } from './engine/progression'
import { SEED_PROFILE, SEED_PROGRAM } from './seed'
import type { Feedback, PlanDay, Program, Session, SetLog } from './types'

export function freshState(): AppState {
  return {
    version: 1,
    profile: SEED_PROFILE,
    program: SEED_PROGRAM,
    sessions: [],
    active: null,
    videos: {},
    bodyweight: [],
    muTests: [],
  }
}

/**
 * If the saved program is an older built-in one, swap in the current built-in program
 * but keep the user's weights and week. Programs imported from the trainer are left alone.
 */
export function migrate(s: AppState): AppState {
  const old = s.program
  if (!old.id.startsWith('seed-') || old.id === SEED_PROGRAM.id) return s
  const weights = new Map<string, number>()
  const targets = new Map<string, number>()
  for (const d of old.days)
    for (const e of d.exercises) {
      if (e.weight != null) weights.set(d.id + e.exerciseId, e.weight)
      targets.set(d.id + e.exerciseId, e.target)
    }
  const days = SEED_PROGRAM.days.map((d) => ({
    ...d,
    exercises: d.exercises.map((e) => {
      const k = d.id + e.exerciseId
      return { ...e, weight: weights.get(k) ?? e.weight, target: targets.get(k) ?? e.target }
    }),
  }))
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
  return new Set(
    s.sessions.filter((x) => x.finished && x.week === s.program.week).map((x) => x.dayId),
  )
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

interface Store {
  state: AppState
  /** begin (or resume) a day */
  start: (dayId: string) => void
  discard: () => void
  updateSet: (exerciseId: string, setIndex: number, patch: Partial<SetLog>) => void
  finish: (feedback: Feedback) => string[]
  nextWeek: () => void
  setVideo: (exerciseId: string, url: string | null) => void
  addMuTest: (reps: number) => void
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
        mut((s) => {
          if (s.active && s.active.dayId === dayId) return s
          const day = s.program.days.find((d) => d.id === dayId)!
          const step = 5
          const sets: SetLog[] = []
          for (const pe of day.exercises) {
            const n = displaySets(pe.sets, s.program.week)
            const step2 = stepFor(pe.exerciseId, s.profile.units)
            for (let i = 0; i < n; i++)
              sets.push({
                exerciseId: pe.exerciseId,
                setIndex: i,
                target: pe.target,
                actual: pe.target,
                weight: displayWeight(pe.weight, s.program.week, step2 || step),
                done: false,
              })
          }
          const active: Session = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            dayId,
            dayLabel: day.label,
            week: s.program.week,
            sets,
            finished: false,
          }
          return { ...s, active }
        })
      },
      discard() {
        mut((s) => ({ ...s, active: null }))
      },
      updateSet(exerciseId, setIndex, patch) {
        mut((s) =>
          !s.active
            ? s
            : {
                ...s,
                active: {
                  ...s.active,
                  sets: s.active.sets.map((x) =>
                    x.exerciseId === exerciseId && x.setIndex === setIndex ? { ...x, ...patch } : x,
                  ),
                },
              },
        )
      },
      finish(feedback) {
        const lines: string[] = []
        const s = state
        if (!s.active) return lines
        // Nothing ticked: do not record a workout that did not happen.
        if (!s.active.sets.some((x) => x.done)) {
          setState({ ...s, active: null })
          return lines
        }
        const act = s.active
        const day = s.program.days.find((d) => d.id === act.dayId)!
        const deload = isDeloadWeek(act.week)
        const exercises = day.exercises.map((pe) => {
          // Stretches and mobility drills are done for quality, not progressed.
          if (getExercise(pe.exerciseId)?.kind === 'mobility') return pe
          const logged = act.sets.filter((x) => x.exerciseId === pe.exerciseId)
          const used = logged
            .filter((x) => x.done && x.weight != null && x.weight > 0)
            .map((x) => x.weight as number)
          // Progress from the weight you actually lifted, not just the prescription.
          const base =
            !deload && pe.weight != null && used.length ? { ...pe, weight: Math.max(...used) } : pe
          const name = getExercise(pe.exerciseId)?.name ?? pe.exerciseId
          const loaded = getExercise(pe.exerciseId)?.kind === 'lift'
          const r = progress(base, logged, feedback, act.week, stepFor(pe.exerciseId, s.profile.units), name, loaded)
          if (r.message) lines.push(r.message)
          return r.next
        })
        const finished: Session = { ...act, feedback, finished: true }
        setState({
          ...s,
          active: null,
          sessions: [...s.sessions, finished],
          program: {
            ...s.program,
            days: s.program.days.map((d) => (d.id === day.id ? { ...d, exercises } : d)),
          },
        })
        return lines
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
      addMuTest(reps) {
        mut((s) => ({ ...s, muTests: [...s.muTests, { date: new Date().toISOString(), reps }] }))
      },
      addBodyweight(value) {
        mut((s) => ({ ...s, bodyweight: [...s.bodyweight, { date: new Date().toISOString(), value }] }))
      },
      replace(next) {
        setState(next)
      },
      importProgram(p) {
        mut((s) => ({ ...s, program: p, active: null }))
      },
    }
  }, [state, mut])

  if (!store) return <div className="p-6 text-muted">Loading…</div>
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

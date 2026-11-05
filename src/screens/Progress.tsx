import { useState } from 'react'
import { LineChart } from '../components/LineChart'
import type { Pt } from '../components/LineChart'
import { useStore } from '../store'
import type { Session } from '../types'

const BENCH = 'Barbell_Bench_Press_-_Medium_Grip'
const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** Best (heaviest) completed set per session for one exercise. */
function bestWeight(sessions: Session[], id: string): Pt[] {
  return sessions.flatMap((s) => {
    const w = s.sets.filter((x) => x.exerciseId === id && x.done && x.weight).map((x) => x.weight as number)
    return w.length ? [{ label: fmt(s.date), value: Math.max(...w) }] : []
  })
}
function bestReps(sessions: Session[], id: string): Pt[] {
  return sessions.flatMap((s) => {
    const r = s.sets.filter((x) => x.exerciseId === id && x.done).map((x) => x.actual)
    return r.length ? [{ label: fmt(s.date), value: Math.max(...r) }] : []
  })
}

/** Epley estimate of a one-rep max. */
export function e1rm(weight: number, reps: number): number {
  return reps <= 1 ? weight : Math.round(weight * (1 + reps / 30))
}

export function Progress() {
  const { state, addMuTest } = useStore()
  const [mu, setMu] = useState('')
  const done = state.sessions.filter((s) => s.finished)

  const bench = bestWeight(done, BENCH)
  // Best estimated 1RM across every logged bench set.
  const benchSets = done.flatMap((s) => s.sets.filter((x) => x.exerciseId === BENCH && x.done && x.weight))
  // Baseline is your 175 x 2. Light-ish training sets must never lower your estimate.
  const BASE = e1rm(175, 2)
  const logged = benchSets.length ? Math.max(...benchSets.map((x) => e1rm(x.weight as number, x.actual))) : 0
  const est = Math.max(BASE, logged)
  const estLabel = logged > BASE ? 'from your logged sets' : 'from your 175 × 2'
  const toGo = Math.max(0, 225 - est)

  const weighted = bestWeight(done, 'X_Weighted_Pullup')
  const strict = bestReps(done, 'Pullups')
  const expl = bestReps(done, 'X_Explosive_Pullup')
  const bestMu = state.muTests.length ? Math.max(...state.muTests.map((t) => t.reps)) : 0
  const sessions = done.length

  return (
    <div className="space-y-4 p-4">
      <h2 className="display text-4xl">Progress</h2>

      <div className="grid grid-cols-3 border-y-[3px] border-ink">
        <Tile label="Sessions" value={String(sessions)} />
        <Tile label="Est. bench max" value={`${est}`} sub="lb" />
        <Tile label="Muscle-ups" value={String(bestMu)} sub="of 10" />
      </div>

      <section className="sheet">
        <h3 className="display text-2xl">Goal 1 · Bench 225</h3>
        <p className="text-[15px] text-muted">
          Estimated max {est} lb ({estLabel}). {toGo > 0 ? `${toGo} lb to go.` : 'Goal reached. Test a true single.'}
        </p>
        <div className="mt-3 h-4 border-2 border-ink" role="img" aria-label={`${Math.round((est / 225) * 100)} percent of goal`}>
          <div className="h-full bg-accent" style={{ width: `${Math.min(100, (est / 225) * 100)}%` }} />
        </div>
      </section>
      <LineChart title="Bench: heaviest set per session" unit="lb" points={bench} goal={225} goalLabel="Goal" />

      <section className="sheet">
        <h3 className="display text-2xl">Goal 2 · 10 muscle-ups</h3>
        <p className="text-[15px] text-muted">
          Test a max set every 4 weeks, fresh, on a day you are not climbing. Log the best clean reps.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            inputMode="numeric"
            value={mu}
            onChange={(e) => setMu(e.target.value)}
            placeholder="Clean reps"
            aria-label="Clean muscle-up reps"
            className="field min-w-0 flex-1"
          />
          <button
            onClick={() => {
              const n = Number(mu)
              if (Number.isFinite(n) && n >= 0 && mu !== '') {
                addMuTest(n)
                setMu('')
              }
            }}
            className="btn"
          >
            Log test
          </button>
        </div>
        {state.muTests.length > 0 && (
          <p className="num mt-2 text-[13px] text-muted">
            {state.muTests.map((t) => `${fmt(t.date)}: ${t.reps}`).join(' · ')}
          </p>
        )}
      </section>
      <LineChart title="Weighted pull-up: heaviest" unit="lb" points={weighted} />
      <LineChart title="Explosive pull-ups: best set" unit="reps" points={expl} />
      <LineChart title="Strict pull-ups: best set" unit="reps" points={strict} />
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-l border-rule px-3 py-2 first:border-l-0">
      <div className="label">{label}</div>
      <div className="display num text-4xl">
        {value}
        {sub && <span className="ml-1 text-sm font-normal normal-case text-muted">{sub}</span>}
      </div>
    </div>
  )
}

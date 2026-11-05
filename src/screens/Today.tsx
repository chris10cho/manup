import { useState } from 'react'
import { ExerciseCard } from '../components/ExerciseCard'
import { RestTimer } from '../components/RestTimer'
import { getExercise } from '../data/library'
import { displaySets, isDeloadWeek } from '../engine/progression'
import { finishedThisWeek, nextDay, useStore, weekComplete } from '../store'
import type { Feedback } from '../types'

export function Today() {
  const store = useStore()
  const { state } = store
  const [rest, setRest] = useState<number | null>(null)
  const [summary, setSummary] = useState<string[] | null>(null)
  const [feedback, setFeedback] = useState<Feedback>('ok')
  const active = state.active
  const week = state.program.week

  if (summary) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="display text-4xl">Workout saved</h2>
        <p className="text-muted">Changes for next time:</p>
        <ul>
          {summary.length === 0 && <li className="row py-2 text-muted">No changes.</li>}
          {summary.map((l, i) => (
            <li key={i} className="row num py-2.5">
              {l}
            </li>
          ))}
        </ul>
        <button onClick={() => setSummary(null)} className="btn w-full">
          Done
        </button>
      </div>
    )
  }

  if (active) {
    const day = state.program.days.find((d) => d.id === active.dayId)!
    const doneSets = active.sets.filter((s) => s.done).length
    return (
      <div className="p-4 pb-44">
        <div className="pb-3">
          <h2 className="display text-4xl">{day.label}</h2>
          <p className="num text-muted">
            Week {week}
            {isDeloadWeek(week) ? ' · deload, go lighter' : ''} · {doneSets}/{active.sets.length} sets
          </p>
        </div>
        {day.exercises.map((pe, i) => (
          <ExerciseCard
            index={i}
            key={pe.exerciseId}
            pe={pe}
            sets={active.sets.filter((s) => s.exerciseId === pe.exerciseId)}
            last={lastFor(state.sessions, pe.exerciseId)}
            onSetDone={(sec) => setRest(sec)}
          />
        ))}
        <div className="sheet py-4">
          <p className="label mb-2">How did it feel?</p>
          <div className="grid grid-cols-3 border-2 border-ink">
            {(['easy', 'ok', 'hard'] as Feedback[]).map((f, i) => (
              <button
                key={f}
                onClick={() => setFeedback(f)}
                aria-pressed={feedback === f}
                className={`display h-12 text-lg ${i ? 'border-l-2 border-ink' : ''} ${feedback === f ? 'bg-ink text-paper' : ''}`}
              >
                {f === 'ok' ? 'Just right' : f}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setRest(null)
              if (doneSets === 0) {
                if (confirm('No sets are ticked. Discard this workout?')) store.discard()
                return
              }
              setSummary(store.finish(feedback))
            }}
            className="btn mt-4 w-full"
          >
            Finish workout
          </button>
          <button onClick={() => confirm('Discard this workout?') && store.discard()} className="mt-2 h-11 w-full text-sm text-muted underline underline-offset-4">
            Discard workout
          </button>
        </div>
        {rest != null && <RestTimer seconds={rest} onClose={() => setRest(null)} />}
      </div>
    )
  }

  const done = finishedThisWeek(state)
  const next = nextDay(state)
  const complete = weekComplete(state)
  return (
    <div className="space-y-4 p-4">
      <div>
        <p className="label num">Week {week}{isDeloadWeek(week) ? ' · deload week' : ''}</p>
        <h2 className="display text-4xl">{complete ? `Week ${week} complete` : "Today's workout"}</h2>
      </div>

      {next && (
        <DayCard
          label={next.label}
          focus={next.focus}
          optional={next.optional}
          count={next.exercises.length}
          minutes={estimate(next.exercises)}
          primary
          action={() => store.start(next.id)}
          names={next.exercises.map((e) => getExercise(e.exerciseId)?.name ?? e.exerciseId)}
          sets={next.exercises.reduce((n, e) => n + displaySets(e.sets, week), 0)}
        />
      )}

      {complete && (
        <button onClick={() => store.nextWeek()} className="btn w-full">
          Start week {week + 1}
        </button>
      )}

      <h3 className="label pt-3">This week</h3>
      <div className="sheet !pt-0">
        {state.program.days.map((d) => (
          <button
            key={d.id}
            onClick={() => store.start(d.id)}
            className="row flex min-h-14 w-full items-center justify-between gap-3 py-2 text-left first:border-t-0"
          >
            <span>
              <span className="display block text-xl">
                {d.when && <span className="num mr-2 text-muted">{d.when}</span>}
                {d.label}
              </span>
              <span className="text-[13px] text-muted">{d.focus}</span>
            </span>
            <span className={`label shrink-0 ${done.has(d.id) ? '!text-ink font-bold' : ''}`}>{done.has(d.id) ? 'Done' : 'Start'}</span>
          </button>
        ))}
        {state.program.outside?.map((o) => (
          <div key={o.when} className="row flex min-h-12 items-center justify-between py-2 text-muted">
            <span className="display text-xl">
              <span className="num mr-2">{o.when}</span>
              {o.label}
            </span>
            <span className="label">Outside</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function lastFor(sessions: ReturnType<typeof useStore>['state']['sessions'], id: string): string | undefined {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const sets = sessions[i].sets.filter((s) => s.exerciseId === id && s.done)
    if (sets.length) {
      const w = Math.max(...sets.map((s) => s.weight ?? 0))
      return `${w ? w + ' × ' : ''}${sets.map((s) => s.actual).join(', ')}`
    }
  }
  return undefined
}

function estimate(list: { sets: number; target: number; unit: string; restSec: number }[]): number {
  let m = 5
  for (const p of list) {
    if (p.unit === 'min') m += p.target
    else if (p.unit === 'sec') m += p.sets * (p.target / 60 + p.restSec / 60)
    else m += p.sets * (p.restSec / 60 + 0.75)
  }
  return Math.round(m / 5) * 5
}

function DayCard(p: {
  label: string
  focus: string
  optional?: boolean
  count: number
  minutes: number
  sets: number
  names: string[]
  primary?: boolean
  action: () => void
}) {
  return (
    <div className="sheet">
      <h3 className="display text-3xl">{p.label}</h3>
      <p className="num text-muted">
        {p.count} exercises · {p.sets} sets · about {p.minutes} min{p.optional ? ' · optional' : ''}
      </p>
      <ol className="mt-3">
        {p.names.map((n, i) => (
          <li key={n} className="row flex gap-3 py-1.5 text-[15px]">
            <span className="num w-6 text-muted">{String(i + 1).padStart(2, '0')}</span>
            {n}
          </li>
        ))}
      </ol>
      <button onClick={p.action} className="btn mt-4 w-full">
        Start workout
      </button>
    </div>
  )
}

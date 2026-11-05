import { useState } from 'react'
import { Demo } from './Demo'
import { useStore } from '../store'
import { getExercise } from '../data/library'
import type { PlanExercise, SetLog } from '../types'

const unitLabel = { reps: 'reps', sec: 'sec', min: 'min' } as const

export function ExerciseCard({
  pe,
  sets,
  onSetDone,
  last,
  index,
}: {
  pe: PlanExercise
  sets: SetLog[]
  onSetDone: (restSec: number) => void
  last?: string
  index: number
}) {
  const { state, updateSet, setVideo } = useStore()
  const ex = getExercise(pe.exerciseId)
  const [open, setOpen] = useState(false)
  const [link, setLink] = useState('')
  if (!ex) return null
  const units = state.profile.units
  const loaded = ex.kind === 'lift'
  const done = sets.filter((s) => s.done).length
  const video = state.videos[ex.id]

  return (
    <section className="sheet py-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="label num">{String(index + 1).padStart(2, '0')}</div>
          <h3 className="display text-[26px]">{ex.name}</h3>
          <p className="num mt-1 text-[15px] text-muted">
            {sets.length} × {pe.target} {unitLabel[pe.unit]}
            {pe.weight != null && loaded ? ` @ ${sets[0]?.weight ?? pe.weight} ${units}` : ''}
            {pe.restSec ? ` · rest ${Math.round((pe.restSec / 60) * 10) / 10} min` : ''}
          </p>
          {last && <p className="num text-[13px] text-muted">Last: {last}</p>}
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="btn btn-line shrink-0 !min-h-11 !px-3 !text-base">
          {open ? 'Hide demo' : 'Play demo'}
        </button>
      </header>

      {pe.note && <p className="mt-3 border-l-[3px] border-accent pl-3 text-[15px]">{pe.note}</p>}

      {open && (
        <div className="mt-3 grid gap-3">
          <Demo ex={ex} video={video} />
          <ol className="list-decimal space-y-1 pl-5 text-[15px]">
            {ex.instructions.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
          <div className="flex gap-2">
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Paste a YouTube link"
              aria-label="YouTube link"
              className="field min-w-0 flex-1 !text-left !text-base px-2"
            />
            <button
              onClick={() => {
                setVideo(ex.id, link || null)
                setLink('')
              }}
              className="btn btn-line !min-h-11 !px-3 !text-base"
            >
              {video && !link ? 'Remove' : 'Use'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="label grid grid-cols-[28px_1fr_1fr_48px] items-end gap-2 pb-1">
          <span>Set</span>
          <span>{loaded ? units : ''}</span>
          <span>{unitLabel[pe.unit]}</span>
          <span />
        </div>
        {sets.map((s) => (
          <div key={s.setIndex} className="row grid grid-cols-[28px_1fr_1fr_48px] items-center gap-2 py-1.5">
            <span className="num text-[17px] text-muted">{s.setIndex + 1}</span>
            {loaded ? (
              <input
                inputMode="decimal"
                type="number"
                aria-label={`Set ${s.setIndex + 1} weight`}
                value={s.weight ?? ''}
                placeholder="–"
                onChange={(e) =>
                  updateSet(s.exerciseId, s.setIndex, { weight: e.target.value === '' ? null : Number(e.target.value) })
                }
                className="field w-full"
              />
            ) : (
              <span className="text-center text-muted">bodyweight</span>
            )}
            <div className="flex items-baseline gap-1">
              <input
                inputMode="numeric"
                type="number"
                aria-label={`Set ${s.setIndex + 1} ${unitLabel[pe.unit]}`}
                value={s.actual}
                onChange={(e) => updateSet(s.exerciseId, s.setIndex, { actual: Number(e.target.value) })}
                className="field w-full"
              />
              <span className="num shrink-0 text-sm text-muted">/{s.target}</span>
            </div>
            <button
              aria-label={`Set ${s.setIndex + 1} done`}
              aria-pressed={s.done}
              onClick={() => {
                updateSet(s.exerciseId, s.setIndex, { done: !s.done })
                if (!s.done && pe.restSec) onSetDone(pe.restSec)
              }}
              className={`grid h-12 w-12 place-items-center border-2 active:translate-y-px ${
                s.done ? 'border-accent bg-accent text-on-accent' : 'border-ink bg-transparent text-transparent'
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="square">
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <p className="num mt-1 text-right text-[13px] text-muted">
        {done}/{sets.length} sets
      </p>
    </section>
  )
}

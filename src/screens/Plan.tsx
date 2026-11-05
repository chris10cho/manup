import { getExercise } from '../data/library'
import { displaySets, displayWeight, isDeloadWeek } from '../engine/progression'
import { stepFor, useStore } from '../store'

export function Plan() {
  const { state } = useStore()
  const { program, profile } = state
  return (
    <div className="space-y-4 p-4">
      <h2 className="display text-4xl">Your plan</h2>
      <section className="sheet">
        <h3 className="display text-2xl">Goals</h3>
        <ol className="mt-1 list-decimal pl-5">
          {profile.goals.map((g) => (
            <li key={g.id}>{g.target ?? g.type}</li>
          ))}
        </ol>
      </section>
      <section className="sheet">
        <h3 className="display text-2xl">Trainer notes</h3>
        <ul className="mt-1 list-disc space-y-1.5 pl-5 text-[15px]">
          {program.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      </section>
      {program.days.map((d) => (
        <section key={d.id} className="sheet">
          <h3 className="display text-2xl">{d.when ? `${d.when} · ` : ''}{d.label}</h3>
          <ul className="mt-2 text-[15px]">
            {d.exercises.map((pe) => {
              const e = getExercise(pe.exerciseId)
              const w = displayWeight(pe.weight, program.week, stepFor(pe.exerciseId, profile.units))
              return (
                <li key={pe.exerciseId} className="row flex justify-between gap-2 py-1.5">
                  <span>{e?.name ?? pe.exerciseId}</span>
                  <span className="num shrink-0 text-muted">
                    {displaySets(pe.sets, program.week)}×{pe.target}
                    {pe.unit === 'sec' ? 's' : pe.unit === 'min' ? 'min' : ''}
                    {w != null ? ` @ ${w}` : ''}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      {isDeloadWeek(program.week) && <p className="text-sm text-warn">Deload week: lighter weights and fewer sets shown.</p>}
    </div>
  )
}

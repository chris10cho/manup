import { LineChart } from '../components/LineChart'
import type { Pt } from '../components/LineChart'
import { getExercise } from '../data/library'
import { useStore } from '../store'
import type { PlanExercise, Session } from '../types'

/** Best value per training week for sets matching `match` (reps or seconds). */
function weeklyBest(sessions: Session[], match: (exerciseId: string) => boolean): Pt[] {
  const best = new Map<number, number>()
  for (const s of sessions)
    for (const x of s.sets)
      if (x.done && match(x.exerciseId)) best.set(s.week, Math.max(best.get(s.week) ?? 0, x.actual))
  return [...best.entries()].sort((a, b) => a[0] - b[0]).map(([w, v]) => ({ label: `Wk ${w}`, value: v }))
}

const isBodyweight = (pattern: string) => (id: string) => {
  const e = getExercise(id)
  // skill drills and the scapular pull-up warm-up are not "pull-ups" for this chart
  return !!e && e.pattern === pattern && e.kind === 'bodyweight' && !id.startsWith('X_FL') && id !== 'Scapular_Pull-Up'
}

export function Progress() {
  const { state } = useStore()
  const done = state.sessions.filter((s) => s.finished)

  // One row per skill ladder, taken from the first day that has it.
  const skills: PlanExercise[] = []
  for (const d of state.program.days)
    for (const e of d.exercises) if (e.skill && e.ladder && !skills.some((x) => x.skill === e.skill)) skills.push(e)

  const fl = skills.find((x) => x.skill === 'fl')
  const flHolds = fl ? weeklyBest(done, (id) => id === fl.exerciseId) : []
  const pulls = weeklyBest(done, isBodyweight('vpull'))
  const pushes = weeklyBest(done, isBodyweight('hpush'))

  return (
    <div className="space-y-4 p-4">
      <h2 className="display text-4xl">Progress</h2>

      <div className="grid grid-cols-3 border-y-[3px] border-ink">
        <Tile label="Sessions" value={String(done.length)} />
        <Tile label="Week" value={String(state.program.week)} />
        <Tile label="Skills" value={String(skills.length)} sub="ladders" />
      </div>

      <section className="sheet">
        <h3 className="display text-2xl">Skill ladders</h3>
        <p className="text-[15px] text-muted">Bar shows how close you are to the next step.</p>
        <ul className="mt-2">
          {skills.map((e) => {
            const level = e.level ?? 0
            const top = level >= (e.ladder?.length ?? 1) - 1
            const pct = top || !e.levelUpAt ? 100 : Math.min(100, Math.round((e.target / e.levelUpAt) * 100))
            const unit = e.unit === 'sec' ? 's' : ' reps'
            return (
              <li key={e.skill} className="row py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="display text-xl">{e.label ?? e.skill}</span>
                  <span className="num shrink-0 text-sm text-muted">
                    {level + 1}/{e.ladder?.length}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2 text-[15px]">
                  <span>{getExercise(e.exerciseId)?.name}</span>
                  <span className="num shrink-0 text-muted">
                    {e.target}
                    {unit}
                    {!top && e.levelUpAt ? ` / ${e.levelUpAt}${unit}` : ''}
                  </span>
                </div>
                <div
                  className="mt-1.5 h-2.5 border border-ink"
                  role="img"
                  aria-label={top ? 'Top level' : `${pct} percent of the way to the next level`}
                >
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {fl && (
        <LineChart
          title={`${getExercise(fl.exerciseId)?.name ?? 'Front lever'}: best hold`}
          unit="s"
          points={flHolds}
          goal={fl.levelUpAt}
          goalLabel="Next level"
        />
      )}
      <LineChart title="Pull-ups: best set by week" unit="reps" points={pulls} />
      <LineChart title="Push-ups: best set by week" unit="reps" points={pushes} />
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

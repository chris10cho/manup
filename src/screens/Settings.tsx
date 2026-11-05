import { useRef, useState } from 'react'
import { getExercise } from '../data/library'
import { useStore } from '../store'
import type { AppState } from '../db'
import type { Program } from '../types'

function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export function Settings() {
  const store = useStore()
  const { state } = store
  const [msg, setMsg] = useState('')
  const [paste, setPaste] = useState('')
  const file = useRef<HTMLInputElement>(null)

  /** Compact summary a trainer (Claude) can read: goals, current plan, and recent logs. */
  function trainerExport(): string {
    const recent = state.sessions.slice(-16).map((s) => ({
      date: s.date.slice(0, 10),
      day: s.dayLabel,
      week: s.week,
      feel: s.feedback,
      lifts: Object.values(
        s.sets
          .filter((x) => x.done)
          .reduce<Record<string, { exercise: string; sets: string[] }>>((acc, x) => {
            const k = x.exerciseId
            acc[k] ??= { exercise: getExercise(k)?.name ?? k, sets: [] }
            acc[k].sets.push(`${x.weight ?? 'bw'}x${x.actual}/${x.target}`)
            return acc
          }, {}),
      ),
    }))
    return JSON.stringify({ profile: state.profile, week: state.program.week, program: state.program, muTests: state.muTests, recent }, null, 1)
  }

  async function copy(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMsg(ok)
    } catch {
      setMsg('Copy blocked by the browser. Use Download instead.')
    }
  }

  function importProgram() {
    try {
      const parsed = JSON.parse(paste) as Program & { program?: Program }
      // Accept the full "Copy for trainer" export as well as a bare program.
      const p = parsed.program && Array.isArray(parsed.program.days) ? parsed.program : parsed
      if (!Array.isArray(p.days) || p.days.some((d) => !Array.isArray(d.exercises)))
        throw new Error('This does not look like a program. Paste the "program" part, or the whole export.')
      for (const d of p.days)
        for (const e of d.exercises)
          if (!getExercise(e.exerciseId)) throw new Error(`Unknown exercise: ${e.exerciseId}`)
      store.importProgram({ ...p, notes: p.notes ?? [], week: p.week ?? state.program.week, cycleDone: 0, id: p.id ?? crypto.randomUUID(), createdAt: p.createdAt ?? new Date().toISOString() })
      setPaste('')
      setMsg('New program loaded. History kept.')
    } catch (e) {
      setMsg(`Could not import: ${e instanceof SyntaxError ? 'that is not valid JSON' : e instanceof Error ? e.message : 'bad format'}`)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="display text-4xl">Trainer &amp; backup</h2>

      <section className="sheet space-y-3">
        <h3 className="display text-2xl">Check in with your trainer</h3>
        <p className="text-[15px] text-muted">
          Copy this and paste it to Claude in chat. You get an updated program back to paste below.
        </p>
        <button onClick={() => copy(trainerExport(), 'Copied. Paste it to Claude.')} className="btn w-full">
          Copy for trainer
        </button>
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Paste the updated program here"
          rows={4}
          className="field !text-left !text-base w-full p-3"
        />
        <button disabled={!paste.trim()} onClick={importProgram} className="btn btn-line w-full">
          Load new program
        </button>
      </section>

      <section className="sheet space-y-3">
        <h3 className="display text-2xl">Backup</h3>
        <p className="text-[15px] text-muted">
          Your data lives on this phone. Download a backup now and then, especially before changing phones or clearing browser data.
        </p>
        <button onClick={() => download(`workout-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state))} className="btn btn-line w-full">
          Download backup
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (!f) return
            try {
              const s = JSON.parse(await f.text()) as AppState
              if (s.version !== 1 || !s.program || !s.profile || !Array.isArray(s.sessions)) throw new Error('not a backup')
              if (confirm('Replace everything on this phone with this backup?')) {
                store.replace(s)
                setMsg('Backup restored.')
              }
            } catch {
              setMsg('That file is not a valid backup.')
            }
            e.target.value = ''
          }}
        />
        <button onClick={() => file.current?.click()} className="btn btn-line w-full">
          Restore from backup
        </button>
      </section>
      {msg && <p role="status" className="border-l-[3px] border-accent pl-3 text-[15px]">{msg}</p>}
    </div>
  )
}

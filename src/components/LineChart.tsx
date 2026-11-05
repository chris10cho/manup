import { useState } from 'react'

export interface Pt {
  label: string
  value: number
}

// Single series in the accent green, hairline grid, dashed goal line in muted ink.
const SERIES = 'var(--accent)'
const SURFACE = 'var(--paper)'
const GRID = 'var(--rule)'
const MUTED = 'var(--muted)'
const INK = 'var(--ink)'

export function LineChart({
  title,
  unit,
  points,
  goal,
  goalLabel,
}: {
  title: string
  unit: string
  points: Pt[]
  goal?: number
  goalLabel?: string
}) {
  const [sel, setSel] = useState<number | null>(null)
  const W = 340
  const H = 170
  const m = { l: 36, r: 12, t: 14, b: 22 }

  if (points.length === 0) {
    return (
      <figure className="sheet py-4">
        <figcaption className="display text-xl">{title}</figcaption>
        <p className="mt-2 text-sm text-muted">Log a session to see this trend.</p>
      </figure>
    )
  }

  const vals = points.map((p) => p.value).concat(goal != null ? [goal] : [])
  let lo = Math.min(...vals)
  let hi = Math.max(...vals)
  const pad = Math.max(1, (hi - lo) * 0.12)
  // round the axis to clean numbers so ticks read 140 / 190 / 240, not 141 / 188 / 234
  const nice = hi - lo > 40 ? 10 : 5
  lo = Math.floor((lo - pad) / nice) * nice
  // make the span a multiple of two steps so the middle tick is a whole step too
  hi = lo + Math.ceil((hi + pad - lo) / (2 * nice)) * 2 * nice
  const x = (i: number) => m.l + (points.length === 1 ? (W - m.l - m.r) / 2 : (i * (W - m.l - m.r)) / (points.length - 1))
  const y = (v: number) => m.t + ((hi - v) / (hi - lo)) * (H - m.t - m.b)
  const ticks = [lo, (lo + hi) / 2, hi]
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')
  const last = points[points.length - 1]
  const active = sel ?? points.length - 1

  function pick(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    let best = 0
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i
    })
    setSel(best)
  }

  return (
    <figure className="sheet py-4">
      <figcaption className="flex items-baseline justify-between">
        <span className="display text-xl">{title}</span>
        <span className="num text-sm text-muted">
          {points[active].label}: {points[active].value} {unit}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full touch-none"
        role="img"
        aria-label={`${title}. Latest ${last.value} ${unit}${goal != null ? `, goal ${goal}` : ''}.`}
        onPointerDown={pick}
        onPointerMove={(e) => e.buttons && pick(e)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={m.l - 6} y={y(t) + 4} textAnchor="end" fontSize={10} fill={MUTED}>
              {t}
            </text>
          </g>
        ))}
        {goal != null && (
          <g>
            <line x1={m.l} x2={W - m.r} y1={y(goal)} y2={y(goal)} stroke={MUTED} strokeWidth={1.5} strokeDasharray="5 4" />
            <text x={W - m.r} y={y(goal) - 5} textAnchor="end" fontSize={10} fill={INK}>
              {goalLabel ?? 'Goal'} {goal}
            </text>
          </g>
        )}
        <line x1={x(active)} x2={x(active)} y1={m.t} y2={H - m.b} stroke={MUTED} strokeWidth={1} />
        <path d={path} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r={i === active ? 5 : 4}
            fill={SERIES}
            stroke={SURFACE}
            strokeWidth={2}
          />
        ))}
        <text x={m.l} y={H - 6} fontSize={10} fill={MUTED}>
          {points[0].label}
        </text>
        {points.length > 1 && (
          <text x={W - m.r} y={H - 6} fontSize={10} fill={MUTED} textAnchor="end">
            {last.label}
          </text>
        )}
      </svg>
      <details className="mt-1 text-sm text-muted">
        <summary className="cursor-pointer">Table view</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <tbody>
            {points.map((p, i) => (
              <tr key={i}>
                <td className="py-0.5">{p.label}</td>
                <td className="py-0.5 text-right">
                  {p.value} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

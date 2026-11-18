import { useEffect, useRef, useState } from 'react'

/** How long "Go" stays on screen after the rest ends before the bar hides itself. */
export const GO_HOLD_MS = 3000

/**
 * Rest countdown. Mount a fresh one (new React key) for every completed set so it always
 * restarts from the full rest. Time is measured against an end timestamp, so it stays correct
 * when the phone locks or the tab is throttled.
 */
export function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000)
  const [now, setNow] = useState(() => Date.now())
  const close = useRef(onClose)
  close.current = onClose
  const left = Math.max(0, Math.ceil((endAt - now) / 1000))

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  // At zero: buzz once, show "Go" briefly, then get out of the way.
  useEffect(() => {
    if (left > 0) return
    navigator.vibrate?.([200, 100, 200])
    const t = setTimeout(() => close.current(), GO_HOLD_MS)
    return () => clearTimeout(t)
  }, [left > 0]) // eslint-disable-line react-hooks/exhaustive-deps

  const m = Math.floor(left / 60)
  const s = left % 60
  return (
    <div
      role="timer"
      className="fixed inset-x-0 bottom-[calc(3.5rem+3px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-xl items-center justify-between bg-accent px-4 py-2 text-on-accent"
    >
      <div className="flex items-baseline gap-3">
        <span className="display text-base tracking-widest">{left <= 0 ? 'Go' : 'Rest'}</span>
        <span className="display num text-[44px] leading-none">
          {m}:{String(s).padStart(2, '0')}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setEndAt((e) => Math.max(e, Date.now()) + 15000)}
          className="display h-11 border-2 border-on-accent px-3 text-lg"
        >
          +15s
        </button>
        <button onClick={() => close.current()} className="display h-11 bg-on-accent px-3 text-lg text-accent">
          {left <= 0 ? 'Close' : 'Skip'}
        </button>
      </div>
    </div>
  )
}

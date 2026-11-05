import { useEffect, useState } from 'react'

export function RestTimer({ seconds, onClose }: { seconds: number; onClose: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => setLeft(seconds), [seconds])
  useEffect(() => {
    if (left <= 0) {
      navigator.vibrate?.([200, 100, 200])
      return
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  const m = Math.floor(Math.max(0, left) / 60)
  const s = Math.max(0, left) % 60
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
        <button onClick={() => setLeft((n) => n + 15)} className="display h-11 border-2 border-on-accent px-3 text-lg">
          +15s
        </button>
        <button onClick={onClose} className="display h-11 bg-on-accent px-3 text-lg text-accent">
          Skip
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { StoreProvider, useStore } from './store'
import { Today } from './screens/Today'
import { Progress } from './screens/Progress'
import { Plan } from './screens/Plan'
import { Settings } from './screens/Settings'

type Tab = 'today' | 'progress' | 'plan' | 'more'
const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'progress', label: 'Progress' },
  { id: 'plan', label: 'Plan' },
  { id: 'more', label: 'More' },
]

function Shell() {
  const [tab, setTab] = useState<Tab>('today')
  const { state } = useStore()
  return (
    <div className="mx-auto min-h-dvh max-w-xl pb-20">
      <main>
        {tab === 'today' && <Today />}
        {tab === 'progress' && <Progress />}
        {tab === 'plan' && <Plan />}
        {tab === 'more' && <Settings />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t-[3px] border-ink bg-paper pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-xl grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`display relative h-14 text-lg tracking-wider ${tab === t.id ? 'text-ink' : 'text-muted'}`}
            >
              <span className={`inline-block border-b-[4px] pb-0.5 ${tab === t.id ? 'border-accent' : 'border-transparent'}`}>{t.label}</span>
              {t.id === 'today' && state.active && <span aria-label="workout in progress" className="absolute right-3 top-2 h-2.5 w-2.5 bg-accent" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

import { openDB } from 'idb'
import type { BodyweightEntry, Profile, Program, Session } from './types'

export interface MuTest {
  date: string
  reps: number
}

export interface AppState {
  version: 1
  profile: Profile
  program: Program
  sessions: Session[]
  active: Session | null
  /** user-pasted YouTube embeds by exercise id */
  videos: Record<string, string>
  bodyweight: BodyweightEntry[]
  muTests: MuTest[]
}

const DB = 'workout-app'
const KEY = 'state'

const dbp = openDB(DB, 1, {
  upgrade(db) {
    db.createObjectStore('kv')
  },
})

export async function loadState(): Promise<AppState | null> {
  try {
    return ((await (await dbp).get('kv', KEY)) as AppState | undefined) ?? null
  } catch {
    return null
  }
}

export async function saveState(s: AppState): Promise<void> {
  await (await dbp).put('kv', s, KEY)
}

/** Ask the browser not to evict our data when storage is tight. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}

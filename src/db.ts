import { openDB } from 'idb'
import type { BodyweightEntry, Profile, Program, Session } from './types'

export interface AppState {
  /** 2 = calisthenics era. Anything older is wiped on load. */
  version: 2
  profile: Profile
  program: Program
  sessions: Session[]
  active: Session | null
  /** user-pasted YouTube embeds by exercise id */
  videos: Record<string, string>
  bodyweight: BodyweightEntry[]
}

const DB = 'workout-app'
const KEY = 'state'

// Opened on first use so importing this module never touches browser APIs.
let opened: ReturnType<typeof openDb> | null = null
function openDb() {
  return openDB(DB, 1, {
    upgrade(db) {
      db.createObjectStore('kv')
    },
  })
}
function getDb() {
  return (opened ??= openDb())
}

export async function loadState(): Promise<AppState | null> {
  try {
    return ((await (await getDb()).get('kv', KEY)) as AppState | undefined) ?? null
  } catch {
    return null
  }
}

export async function saveState(s: AppState): Promise<void> {
  await (await getDb()).put('kv', s, KEY)
}

/** Ask the browser not to evict our data when storage is tight. */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}

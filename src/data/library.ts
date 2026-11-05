import raw from './exercises.json'
import type { Exercise } from '../types'

export const EXERCISES = raw as Exercise[]

const index = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise | undefined {
  return index.get(id)
}

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

/** Start/end position photos for the demo loop. */
export function frameUrls(ex: Exercise): string[] {
  return ex.frames.map((f) => BASE + f)
}

/** Turn a pasted YouTube link into an embeddable one. Returns null if not recognised. */
export function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url.trim())
    let id: string | null = null
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1)
    else if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname === '/watch') id = u.searchParams.get('v')
      else if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/'))
        id = u.pathname.split('/')[2]
    }
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
  } catch {
    return null
  }
}

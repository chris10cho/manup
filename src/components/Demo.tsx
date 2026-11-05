import { useEffect, useState } from 'react'
import { frameUrls, youtubeEmbed } from '../data/library'
import type { Exercise } from '../types'

/** Looping start/end photo demo, or a pasted YouTube video if the user added one. */
export function Demo({ ex, video }: { ex: Exercise; video?: string }) {
  const [i, setI] = useState(0)
  const frames = frameUrls(ex)
  const embed = video ? youtubeEmbed(video) : null

  useEffect(() => {
    if (embed || frames.length < 2) return
    const t = setInterval(() => setI((n) => (n + 1) % frames.length), 900)
    return () => clearInterval(t)
  }, [embed, frames.length])

  if (embed) {
    return (
      <div className="aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={embed}
          title={ex.name}
          className="h-full w-full"
          allow="accelerometer; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' form')}`
  return (
    <div>
      {frames.length > 0 ? (
        <img
          src={frames[i]}
          alt={`${ex.name} demo`}
          className="mx-auto max-h-64 w-full border border-rule bg-white object-contain"
        />
      ) : (
        <div className="border border-rule p-4 text-sm text-muted">No demo photos for this move.</div>
      )}
      {ex.custom && (
        <p className="mt-2 text-sm text-warn">Photos show a similar move. Read the steps below.</p>
      )}
      <a href={search} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm underline underline-offset-4">
        Find a form video on YouTube
      </a>
    </div>
  )
}

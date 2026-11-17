/**
 * Pick one variation from a pool, avoiding the ones in `avoid` when possible
 * (e.g. last time's pick and anything already used today).
 */
export function pickVariation(pool: string[], avoid: Set<string>, rng: () => number = Math.random): string {
  const fresh = pool.filter((id) => !avoid.has(id))
  const options = fresh.length ? fresh : pool
  return options[Math.min(options.length - 1, Math.floor(rng() * options.length))]
}

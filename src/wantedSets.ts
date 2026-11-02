import type { DexEntry } from './types'

export interface WantedSet {
  id: string
  name: string
  abbreviation: string | null
  releaseDate: string
  // Wanted cards in this set, in collector-number order.
  entries: DexEntry[]
}

// Sets that still have wanted cards, so sets holding the oldest generations'
// cards come first (the lowest dex number wanted in each set decides).
export function groupWantedBySet(entries: DexEntry[]): WantedSet[] {
  const sets = new Map<string, WantedSet>()
  for (const entry of entries) {
    if (entry.status !== 'wanted') continue
    const found = sets.get(entry.set_id)
    if (found) {
      found.entries.push(entry)
    } else {
      sets.set(entry.set_id, {
        id: entry.set_id,
        name: entry.set_name,
        abbreviation: entry.set_abbreviation,
        releaseDate: entry.release_date,
        entries: [entry],
      })
    }
  }

  const firstDex = (set: WantedSet) => Math.min(...set.entries.map((entry) => entry.dex_id))
  for (const set of sets.values()) {
    set.entries.sort((a, b) =>
      a.local_id.localeCompare(b.local_id, 'en', { numeric: true }),
    )
  }
  return [...sets.values()].sort(
    (a, b) => firstDex(a) - firstDex(b) || a.releaseDate.localeCompare(b.releaseDate),
  )
}

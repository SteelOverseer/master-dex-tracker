import type { DexEntry } from '../types'

export function ProgressCount({ entries }: { entries: DexEntry[] }) {
  const owned = entries.filter((entry) => entry.status === 'owned').length

  return (
    <section className="progress">
      <progress value={owned} max={entries.length} aria-label="Owned cards" />
      <p>
        <strong>
          {owned} / {entries.length}
        </strong>
      </p>
    </section>
  )
}

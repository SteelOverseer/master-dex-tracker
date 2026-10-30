import { useState } from 'react'
import type { DexEntry } from '../types'
import { DexCard } from './DexCard'

interface Props {
  title: string
  subtitle?: string
  entries: DexEntry[]
  // Show the cards regardless of the remembered state, e.g. while searching.
  forceOpen?: boolean
}

// Storage can be unavailable or throw (private windows, blocked site data),
// so fall back to open and ignore write failures.
function readOpen(key: string) {
  try {
    return localStorage.getItem(key) !== 'closed'
  } catch {
    return true
  }
}

function writeOpen(key: string, open: boolean) {
  try {
    localStorage.setItem(key, open ? 'open' : 'closed')
  } catch {
    // Not remembering the state is fine.
  }
}

export function GenerationSection({ title, subtitle, entries, forceOpen = false }: Props) {
  const storageKey = `section:${title}`
  const [open, setOpen] = useState(() => readOpen(storageKey))
  const owned = entries.filter((entry) => entry.status === 'owned').length

  return (
    <details
      className="generation"
      open={open || forceOpen}
      onToggle={(event) => {
        // Forcing a section open must not overwrite the remembered state.
        if (forceOpen) return
        const nowOpen = event.currentTarget.open
        setOpen(nowOpen)
        writeOpen(storageKey, nowOpen)
      }}
    >
      <summary>
        <h2>
          {title}
          {subtitle && <span className="generation-region"> {subtitle}</span>}
          <span className="generation-count">
            {owned} / {entries.length}
          </span>
        </h2>
      </summary>
      <div className="dex-grid">
        {entries.map((entry) => (
          <DexCard key={entry.dex_id} entry={entry} />
        ))}
      </div>
    </details>
  )
}

import { useState } from 'react'
import type { DexEntry } from '../types'
import { DexCard } from './DexCard'

interface Props {
  title: string
  subtitle?: string
  entries: DexEntry[]
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

export function GenerationSection({ title, subtitle, entries }: Props) {
  const storageKey = `section:${title}`
  const [open, setOpen] = useState(() => readOpen(storageKey))
  const owned = entries.filter((entry) => entry.status === 'owned').length

  return (
    <details
      className="generation"
      open={open}
      onToggle={(event) => {
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

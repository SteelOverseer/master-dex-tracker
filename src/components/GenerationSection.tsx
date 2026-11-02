import { useState } from 'react'
import type { ReactNode } from 'react'
import type { DexEntry } from '../types'

interface Props {
  title: string
  subtitle?: string
  entries: DexEntry[]
  // Show the cards regardless of the remembered state, e.g. while searching.
  forceOpen?: boolean
  children: ReactNode
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

export function GenerationSection({ title, subtitle, entries, forceOpen = false, children }: Props) {
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
      {children}
    </details>
  )
}

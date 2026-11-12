import { useEffect, useRef, useState } from 'react'

// Open/closed state for the sidebar drawer on narrow screens. While open, Esc
// closes it and focus moves into it; closing it yourself (Esc, the close
// button, the backdrop) puts focus back on the menu button.
export function useDrawer() {
  const [open, setOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeButton.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButton.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return {
    open,
    menuButton,
    closeButton,
    show: () => setOpen(true),
    // For closing it on the way somewhere else, e.g. after picking a set.
    hide: () => setOpen(false),
    // For closing it on purpose; focus goes back to the menu button.
    dismiss: () => {
      setOpen(false)
      menuButton.current?.focus()
    },
  }
}

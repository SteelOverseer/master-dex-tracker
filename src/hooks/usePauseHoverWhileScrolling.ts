import { useEffect } from 'react'

// Scrolling slides cards under a resting pointer, so they would zoom as they
// land. While the page scrolls, mark it with data-scrolling (the hover styles
// in index.css check for it) and clear it once the pointer really moves.
export function usePauseHoverWhileScrolling() {
  useEffect(() => {
    const root = document.documentElement
    const pause = () => {
      root.dataset.scrolling = ''
    }
    // Browsers may send a movement-free pointer event when scrolling stops,
    // so only a real movement counts.
    const resume = (event: PointerEvent) => {
      if (event.movementX !== 0 || event.movementY !== 0) delete root.dataset.scrolling
    }

    window.addEventListener('scroll', pause, { capture: true, passive: true })
    window.addEventListener('pointermove', resume, { passive: true })
    return () => {
      window.removeEventListener('scroll', pause, { capture: true })
      window.removeEventListener('pointermove', resume)
      delete root.dataset.scrolling
    }
  }, [])
}

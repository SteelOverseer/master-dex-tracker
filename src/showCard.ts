// The element id of a dex number's card, in both the grid and the binder.
export function cardElementId(dexId: number) {
  return `dex-${dexId}`
}

// Scrolls a card into view and flashes a highlight around it, opening its
// generation section first if it's collapsed.
export function showCard(dexId: number) {
  const card = document.getElementById(cardElementId(dexId))
  if (!card) return

  // Opening the section fires its toggle event, so it remembers being open.
  const section = card.closest('details')
  if (section && !section.open) section.open = true

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })

  // Restart the highlight if it's still running from an earlier click.
  delete card.dataset.highlight
  void card.offsetWidth
  card.dataset.highlight = ''
  card.addEventListener('animationend', () => delete card.dataset.highlight, { once: true })
}

import type { WantedSet } from './wantedSets'

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

// Plain text, one heading per set and one line per card, for pasting anywhere.
export function buildShoppingList(sets: WantedSet[]) {
  let cards = 0
  let unpriced = 0
  let total = 0

  const sections = sets.map((set) => {
    const lines = set.entries.map((entry) => {
      cards++
      if (entry.price === null) unpriced++
      else total += entry.price
      const price = entry.price === null ? '-' : priceFormat.format(entry.price)
      return `- ${entry.name} #${entry.local_id} (${price})`
    })
    const abbreviation = set.abbreviation ? ` (${set.abbreviation})` : ''
    return [`${set.name}${abbreviation}`, ...lines].join('\n')
  })

  const note = unpriced > 0 ? `, ${unpriced} without a price` : ''
  const summary = `Total: ${cards} ${cards === 1 ? 'card' : 'cards'}, ${priceFormat.format(total)}${note}`
  return [...sections, summary].join('\n\n')
}

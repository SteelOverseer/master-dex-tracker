import type { DexEntry } from './types'

export const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const percentFormat = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
})

// "+$1.25" / "−$0.80", or just the amount when an arrow already shows the
// direction.
export function formatChange(change: number, withSign = true) {
  const amount = priceFormat.format(Math.abs(change))
  if (!withSign) return amount
  return `${change > 0 ? '+' : '−'}${amount}`
}

// The change as a share of the earlier price, e.g. "12%".
export function formatPercent(price: number, change: number) {
  return percentFormat.format(Math.abs(change) / (price - change))
}

// "Up $1.25 (12%) this week, from $10.40", for tooltips.
export function describeChange(price: number, change: number) {
  const direction = change > 0 ? 'Up' : 'Down'
  const from = priceFormat.format(price - change)
  return `${direction} ${formatChange(change, false)} (${formatPercent(price, change)}) this week, from ${from}`
}

export interface PriceMover {
  entry: DexEntry
  price: number
  change: number
}

// Wanted cards whose price moved, biggest rise first and biggest drop first.
export function wantedPriceMovers(entries: DexEntry[]) {
  const movers: PriceMover[] = []
  for (const entry of entries) {
    if (entry.status !== 'wanted' || entry.price === null || entry.price_change === null) continue
    movers.push({ entry, price: entry.price, change: entry.price_change })
  }
  return {
    up: movers.filter((m) => m.change > 0).sort((a, b) => b.change - a.change),
    down: movers.filter((m) => m.change < 0).sort((a, b) => a.change - b.change),
  }
}

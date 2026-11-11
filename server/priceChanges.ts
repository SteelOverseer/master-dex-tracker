import { db } from './db.ts'
import { CHOSEN_CARDS } from './queries.ts'

// How far back a price change is measured.
export const CHANGE_WINDOW_DAYS = 7

// Smaller moves are noise, mostly pennies on cheap cards, so they count as no
// change. A move has to clear both limits.
const MIN_CHANGE_DOLLARS = 0.25
const MIN_CHANGE_FRACTION = 0.05

// A CTE (prefix with `WITH`, or join after another with a comma) giving each
// card's baseline price for comparison: the last price recorded at least
// CHANGE_WINDOW_DAYS ago, or the earliest one if the history is younger than
// that. Only prices of the variant the current price comes from count, so
// switching to a cheaper variant doesn't look like a price drop.
export const PRICE_BASELINE = `
  baseline AS (
    SELECT h.card_id, h.price,
           ROW_NUMBER() OVER (
             PARTITION BY h.card_id
             ORDER BY h.recorded_at <= datetime('now', '-${CHANGE_WINDOW_DAYS} days') DESC,
                      CASE WHEN h.recorded_at <= datetime('now', '-${CHANGE_WINDOW_DAYS} days')
                           THEN h.id END DESC,
                      h.id
           ) AS rank
    FROM price_history h
    JOIN card_prices cp ON cp.card_id = h.card_id AND cp.variant IS h.variant
    WHERE h.price IS NOT NULL
  )
`

// The change from the baseline in dollars, or NULL when it's too small to
// matter or there's nothing to compare. Needs `cp` (card_prices) and `b`
// (baseline, rank 1) joined in.
export const PRICE_CHANGE = `
  CASE
    WHEN ABS(cp.price - b.price) >= ${MIN_CHANGE_DOLLARS}
     AND ABS(cp.price - b.price) >= ${MIN_CHANGE_FRACTION} * b.price
    THEN ROUND(cp.price - b.price, 2)
  END
`

export interface PriceMover {
  dex_id: number
  name: string
  set_name: string
  local_id: string
  price: number
  change: number
}

const wantedMovers = db.prepare(`
  WITH ${CHOSEN_CARDS}, ${PRICE_BASELINE}
  SELECT * FROM (
    SELECT ch.dex_id, p.name, s.name AS set_name, p.local_id, cp.price,
           ${PRICE_CHANGE} AS change
    FROM chosen ch
    JOIN printings p ON p.card_id = ch.card_id
    JOIN sets s ON s.id = p.set_id
    JOIN card_prices cp ON cp.card_id = ch.card_id
    JOIN baseline b ON b.card_id = ch.card_id AND b.rank = 1
    WHERE ch.status = 'wanted'
  )
  WHERE change IS NOT NULL
  ORDER BY change DESC
`)

// Wanted cards whose price moved enough to matter, biggest rise first.
export function wantedPriceMovers() {
  return wantedMovers.all() as unknown as PriceMover[]
}

const changeForCard = db.prepare(`
  WITH ${PRICE_BASELINE}
  SELECT ${PRICE_CHANGE} AS change
  FROM card_prices cp
  JOIN baseline b ON b.card_id = cp.card_id AND b.rank = 1
  WHERE cp.card_id = ?
`)

// The same change as above for one card, or null.
export function priceChange(cardId: string) {
  const row = changeForCard.get(cardId) as { change: number | null } | undefined
  return row?.change ?? null
}

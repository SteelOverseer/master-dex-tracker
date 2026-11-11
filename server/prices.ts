import { db } from './db.ts'
import { tcgdex, withRetry } from './tcgdex.ts'

// TCGdex returns `pricing` at runtime but doesn't type it. TCGplayer lists a
// price object per variant (normal, holofoil, ...) next to `unit` and `updated`.
interface TcgplayerVariant {
  marketPrice?: number | null
}
interface CardWithPricing {
  pricing?: { tcgplayer?: Record<string, unknown> }
}

// The cheapest TCGplayer market price across the card's variants.
function cheapestMarketPrice(card: CardWithPricing) {
  let best: { price: number; variant: string } | null = null
  for (const [variant, value] of Object.entries(card.pricing?.tcgplayer ?? {})) {
    const price = (value as TcgplayerVariant | null)?.marketPrice
    if (typeof price === 'number' && (!best || price < best.price)) {
      best = { price, variant }
    }
  }
  return best
}

const isFresh = db.prepare(
  `SELECT 1 FROM card_prices WHERE card_id = ? AND fetched_at > datetime('now', '-1 day')`,
)
const savePrice = db.prepare(`
  INSERT INTO card_prices (card_id, price, variant) VALUES (?, ?, ?)
  ON CONFLICT(card_id) DO UPDATE SET
    price = excluded.price,
    variant = excluded.variant,
    fetched_at = CURRENT_TIMESTAMP
`)
// Adds a history row unless the card's latest one already says the same.
const recordHistory = db.prepare(`
  INSERT INTO price_history (card_id, price, variant)
  SELECT :card_id, :price, :variant
  WHERE NOT EXISTS (
    SELECT 1 FROM (
      SELECT price, variant FROM price_history
      WHERE card_id = :card_id ORDER BY id DESC LIMIT 1
    ) AS latest
    WHERE latest.price IS :price AND latest.variant IS :variant
  )
`)
const readPrice = db.prepare(`SELECT price FROM card_prices WHERE card_id = ?`)

export function hasFreshPrice(cardId: string) {
  return Boolean(isFresh.get(cardId))
}

// Fetches and stores a card's price unless we already have a recent one.
export async function refreshPrice(cardId: string) {
  if (!hasFreshPrice(cardId)) {
    const card = await withRetry(() => tcgdex.fetch('cards', cardId))
    if (card) {
      const best = cheapestMarketPrice(card as CardWithPricing)
      const price = best?.price ?? null
      const variant = best?.variant ?? null
      savePrice.run(cardId, price, variant)
      recordHistory.run({ card_id: cardId, price, variant })
    }
  }
  return (readPrice.get(cardId)?.price as number | null | undefined) ?? null
}

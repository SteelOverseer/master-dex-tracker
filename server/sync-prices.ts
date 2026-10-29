import { db } from './db.ts'
import { CHOSEN_CARDS } from './queries.ts'
import { hasFreshPrice, refreshPrice } from './prices.ts'
import { DELAY_MS, sleep } from './tcgdex.ts'

// Usage: node server/sync-prices.ts [limit]
// Fetches TCGplayer prices for the card shown in each dex slot. Cards with a
// price fetched in the last day are skipped, so it is safe to re-run.
const limit = process.argv[2] ? Number(process.argv[2]) : Infinity

const rows = db
  .prepare(`WITH ${CHOSEN_CARDS} SELECT card_id FROM chosen ORDER BY dex_id`)
  .all() as { card_id: string }[]

const stale = rows.filter((row) => !hasFreshPrice(row.card_id)).slice(0, limit)
console.log(`Prices to fetch: ${stale.length} of ${rows.length} slots`)

for (const [index, { card_id }] of stale.entries()) {
  const price = await refreshPrice(card_id)
  await sleep(DELAY_MS)
  console.log(`  ${index + 1}/${stale.length} ${card_id}: ${price ?? 'no price'}`)
}
console.log('Done')

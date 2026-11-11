import { db } from './db.ts'
import { CHOSEN_CARDS } from './queries.ts'
import { CHANGE_WINDOW_DAYS, type PriceMover, wantedPriceMovers } from './priceChanges.ts'
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

// What moved among the cards you still want, measured over the same window
// the app uses, so the two always agree.
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const signed = (change: number) => `${change > 0 ? '+' : '-'}${money.format(Math.abs(change))}`
const describe = (m: PriceMover) =>
  `  ${signed(m.change).padStart(9)}  #${m.dex_id} ${m.name} (${m.set_name} #${m.local_id}), now ${money.format(m.price)}`

const movers = wantedPriceMovers()
const up = movers.filter((m) => m.change > 0)
const down = movers.filter((m) => m.change < 0).reverse()
console.log(`\nWanted cards over the last ${CHANGE_WINDOW_DAYS} days: ${up.length} up, ${down.length} down`)
if (up.length) console.log(['Biggest rises:', ...up.slice(0, 5).map(describe)].join('\n'))
if (down.length) console.log(['Biggest drops:', ...down.slice(0, 5).map(describe)].join('\n'))

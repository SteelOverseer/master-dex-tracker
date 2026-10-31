import { db } from './db.ts'
import { DELAY_MS, sleep, tcgdex, withRetry } from './tcgdex.ts'

// Usage: node server/sync.ts [limit]
// With a limit, only the first N dex numbers are synced.
const limit = process.argv[2] ? Number(process.argv[2]) : Infinity
const DIGITAL_SERIES = 'tcgp'

const insertSet = db.prepare(
  `INSERT OR REPLACE INTO sets (id, name, series_id, release_date, abbreviation)
   VALUES (?, ?, ?, ?, ?)`,
)
const insertPrinting = db.prepare(
  `INSERT OR REPLACE INTO printings (card_id, dex_id, set_id, local_id, name, image)
   VALUES (?, ?, ?, ?, ?, ?)`,
)

// The SDK's set type leaves out the abbreviation the API returns.
function abbreviationOf(set: object) {
  return (set as { abbreviation?: { official?: string } }).abbreviation?.official ?? null
}

function inTransaction(work: () => void) {
  db.exec('BEGIN')
  try {
    work()
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

// Step 1: physical sets, plus a lookup from card id to set id.
async function syncSets() {
  const digital = await withRetry(() => tcgdex.fetch('series', DIGITAL_SERIES))
  const skip = new Set(digital?.sets.map((set) => set.id))

  const list = (await withRetry(() => tcgdex.fetch('sets'))) ?? []
  const wanted = list.filter((set) => !skip.has(set.id))
  console.log(`Sets: ${wanted.length} physical, ${skip.size} digital skipped`)

  const cardToSet = new Map<string, string>()
  for (const [index, { id }] of wanted.entries()) {
    const set = await withRetry(() => tcgdex.fetch('sets', id))
    await sleep(DELAY_MS)
    if (!set) {
      console.warn(`  no data for set ${id}`)
      continue
    }

    insertSet.run(
      set.id,
      set.name,
      set.serie.id,
      set.releaseDate,
      abbreviationOf(set),
    )
    for (const card of set.cards) cardToSet.set(card.id, set.id)
    if ((index + 1) % 25 === 0) console.log(`  sets ${index + 1}/${wanted.length}`)
  }
  return cardToSet
}

// Step 2: every printing for each dex number, kept only if its set is physical.
async function syncPrintings(cardToSet: Map<string, string>) {
  const dexIds = ((await withRetry(() => tcgdex.fetch('dex-ids'))) ?? [])
    .map(Number)
    .sort((a, b) => a - b)
    .slice(0, limit)
  console.log(`Dex numbers to sync: ${dexIds.length}`)

  for (const dexId of dexIds) {
    const result = await withRetry(() => tcgdex.fetch('dex-ids', String(dexId)))
    await sleep(DELAY_MS)
    if (!result) console.warn(`  no data for #${dexId}`)

    let kept = 0
    inTransaction(() => {
      for (const card of result?.cards ?? []) {
        const setId = cardToSet.get(card.id)
        if (!setId) continue
        insertPrinting.run(card.id, dexId, setId, card.localId, card.name, card.image ?? null)
        kept++
      }
    })
    console.log(`  #${dexId} ${result?.name}: ${kept}/${result?.cards.length ?? 0} printings kept`)
  }
}

const cardToSet = await syncSets()
await syncPrintings(cardToSet)
console.log('Done')

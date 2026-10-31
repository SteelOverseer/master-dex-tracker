import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './db.ts'
import { refreshPrice } from './prices.ts'
import { CHOSEN_CARDS } from './queries.ts'

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))

// One row per dex number: the card you picked if you have, otherwise its
// earliest printing, along with your status and its price (null when unknown).
const dexEntries = db.prepare(`
  WITH ${CHOSEN_CARDS}
  SELECT ch.dex_id, p.card_id, p.local_id, p.name, p.image,
         s.id AS set_id, s.name AS set_name, s.abbreviation AS set_abbreviation,
         s.release_date, ch.status, cp.price
  FROM chosen ch
  JOIN printings p ON p.card_id = ch.card_id
  JOIN sets s ON s.id = p.set_id
  LEFT JOIN card_prices cp ON cp.card_id = ch.card_id
  ORDER BY ch.dex_id
`)

app.get('/api/dex', (c) => c.json(dexEntries.all()))

const printingsForDex = db.prepare(`
  SELECT p.card_id, p.local_id, p.name, p.image, s.name AS set_name, s.release_date
  FROM printings p
  JOIN sets s ON s.id = p.set_id
  WHERE p.dex_id = ?
  ORDER BY s.release_date, p.card_id
`)

app.get('/api/dex/:dexId/printings', (c) => {
  const dexId = Number(c.req.param('dexId'))
  if (!Number.isInteger(dexId)) return c.json({ error: 'Invalid dex id' }, 400)
  return c.json(printingsForDex.all(dexId))
})

const printingBelongsToDex = db.prepare(
  `SELECT 1 FROM printings WHERE card_id = ? AND dex_id = ?`,
)
const saveEntry = db.prepare(`
  INSERT INTO collection (dex_id, card_id, status) VALUES (?, ?, ?)
  ON CONFLICT(dex_id) DO UPDATE SET
    card_id = excluded.card_id,
    status = excluded.status,
    updated_at = CURRENT_TIMESTAMP
`)

app.put('/api/dex/:dexId', async (c) => {
  const dexId = Number(c.req.param('dexId'))
  if (!Number.isInteger(dexId)) return c.json({ error: 'Invalid dex id' }, 400)

  const body = await c.req.json().catch(() => null)
  const cardId = body?.card_id
  const status = body?.status
  if (typeof cardId !== 'string') return c.json({ error: 'card_id is required' }, 400)
  if (status !== 'wanted' && status !== 'owned') {
    return c.json({ error: "status must be 'wanted' or 'owned'" }, 400)
  }
  if (!printingBelongsToDex.get(cardId, dexId)) {
    return c.json({ error: 'That card is not a printing of this Pokémon' }, 400)
  }

  saveEntry.run(dexId, cardId, status)

  // Make sure the newly chosen card has a price. A failure here must not
  // undo the save, so fall back to no price.
  const price = await refreshPrice(cardId).catch((error) => {
    console.warn(`Could not fetch price for ${cardId}:`, error)
    return null
  })
  return c.json({ dex_id: dexId, card_id: cardId, status, price })
})

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})

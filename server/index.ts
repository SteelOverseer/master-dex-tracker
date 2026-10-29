import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './db.ts'

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))

// One row per dex number: the card you picked if you have, otherwise its
// earliest printing, along with your status (null when untouched).
const dexEntries = db.prepare(`
  WITH earliest AS (
    SELECT p.dex_id, p.card_id,
           ROW_NUMBER() OVER (
             PARTITION BY p.dex_id ORDER BY s.release_date, p.card_id
           ) AS rank
    FROM printings p
    JOIN sets s ON s.id = p.set_id
  ),
  chosen AS (
    SELECT e.dex_id, COALESCE(c.card_id, e.card_id) AS card_id, c.status
    FROM earliest e
    LEFT JOIN collection c ON c.dex_id = e.dex_id
    WHERE e.rank = 1
  )
  SELECT ch.dex_id, p.card_id, p.local_id, p.name, p.image,
         s.name AS set_name, s.release_date, ch.status
  FROM chosen ch
  JOIN printings p ON p.card_id = ch.card_id
  JOIN sets s ON s.id = p.set_id
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
  return c.json({ dex_id: dexId, card_id: cardId, status })
})

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})

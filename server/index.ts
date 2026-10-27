import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { db } from './db.ts'

const app = new Hono()

app.get('/api/health', (c) => c.json({ ok: true }))

// The default card for each dex number: its earliest printing.
const earliestPrintings = db.prepare(`
  SELECT dex_id, card_id, name, image, set_name, release_date
  FROM (
    SELECT p.dex_id, p.card_id, p.name, p.image,
           s.name AS set_name, s.release_date,
           ROW_NUMBER() OVER (
             PARTITION BY p.dex_id ORDER BY s.release_date, p.card_id
           ) AS rank
    FROM printings p
    JOIN sets s ON s.id = p.set_id
  )
  WHERE rank = 1
  ORDER BY dex_id
`)

app.get('/api/dex', (c) => c.json(earliestPrintings.all()))

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})

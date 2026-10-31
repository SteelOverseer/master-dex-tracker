import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dataDir = join(import.meta.dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(join(dataDir, 'app.db'))

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS sets (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    series_id    TEXT NOT NULL,
    release_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS printings (
    card_id  TEXT PRIMARY KEY,
    dex_id   INTEGER NOT NULL,
    set_id   TEXT NOT NULL REFERENCES sets(id),
    local_id TEXT NOT NULL,
    name     TEXT NOT NULL,
    image    TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_printings_dex_id ON printings(dex_id);

  CREATE TABLE IF NOT EXISTS card_prices (
    card_id    TEXT PRIMARY KEY REFERENCES printings(card_id),
    price      REAL,
    variant    TEXT,
    fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS collection (
    dex_id     INTEGER PRIMARY KEY,
    card_id    TEXT NOT NULL REFERENCES printings(card_id),
    status     TEXT NOT NULL CHECK (status IN ('wanted', 'owned')),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

// Added after the first release, so databases created earlier need the column.
const setColumns = db.prepare(`PRAGMA table_info(sets)`).all() as { name: string }[]
if (!setColumns.some((column) => column.name === 'abbreviation')) {
  db.exec(`ALTER TABLE sets ADD COLUMN abbreviation TEXT`)
}

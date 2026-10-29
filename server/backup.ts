import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { db } from './db.ts'

// Usage: node server/backup.ts   (or: npm run backup)
// Writes a consistent snapshot of the database to backups/ and keeps the
// newest few. Safe to run while the server is up.
const KEEP = 10

const backupDir = join(import.meta.dirname, '..', 'backups')
mkdirSync(backupDir, { recursive: true })

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const file = join(backupDir, `app-${stamp}.db`)
db.prepare('VACUUM INTO ?').run(file)
console.log(`Backed up to ${file}`)

const old = readdirSync(backupDir)
  .filter((name) => /^app-.*\.db$/.test(name))
  .sort()
  .slice(0, -KEEP)
for (const name of old) rmSync(join(backupDir, name))
if (old.length) console.log(`Removed ${old.length} old backup(s)`)

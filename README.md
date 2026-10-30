# Master Dex Tracker

A personal visual checklist for a Pokémon TCG **master dex**: one card for every Pokémon in the National Pokédex, preferably its original English printing.

Every Pokémon starts as a grayed-out card showing its earliest printing. Pick a different printing from the dropdown to mark it as wanted, and click the card to mark it as owned.

## Features

- All 1,025 Pokémon, grouped into collapsible generations (open or closed state is remembered)
- Defaults to each Pokémon's earliest physical printing, with a dropdown of every other printing
- Wanted and owned states, saved to a local SQLite database
- Progress bar and per-generation counts
- TCGplayer market price (USD) on each card

## Tech

- **Front end:** React 19, TypeScript, Vite, TanStack Query
- **Back end:** [Hono](https://hono.dev) on Node, using Node's built-in `node:sqlite` and native TypeScript support (no build step for `server/`)
- **Data:** [TCGdex](https://tcgdex.dev) through its JavaScript SDK

Developed on Node 26. It needs a Node version that can run TypeScript files directly and has `node:sqlite`.

## Getting started

```bash
npm install

# One-time data sync (gentle on the public API: one request at a time, with a delay)
node server/sync.ts          # sets and printings, roughly 12-15 minutes
node server/sync-prices.ts   # prices for the card in each slot, roughly 10 minutes

# Run the app (two terminals)
npm run server               # API on http://localhost:3000
npm run dev                  # front end, proxies /api to the server
```

Both sync scripts take an optional number to limit the run, for example `node server/sync.ts 9` syncs the first 9 Pokémon. They are safe to re-run: `sync.ts` updates existing rows, and `sync-prices.ts` skips prices fetched in the last day. Set `SYNC_DELAY_MS` to change the pause between requests (default 500).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run server` | API server, restarts on changes |
| `npm run backup` | Snapshot the database to `backups/`, keeping the newest 10 |
| `npm run build` | Type-check and build the front end |
| `npm run lint` | ESLint |

## How it works

- `server/sync.ts` downloads every physical set and each Pokémon's cards from TCGdex into SQLite. Pokémon TCG Pocket sets are skipped because they are digital only.
- The default card for each Pokémon is its printing from the earliest set release date (ties are broken by card ID).
- Your picks live in the `collection` table, one row per Pokémon with a status of `wanted` or `owned`. Everything else in the database can be rebuilt by re-running the sync scripts, so **`collection` is the only data worth backing up**.
- Prices come from the TCGdex card data (TCGplayer market price). When a card has several variants, the cheapest is shown.

The database lives in `data/app.db` and backups in `backups/`. Both are gitignored.

## Known limitations

- **Early-set images:** TCGdex has one entry and image per card, so 1st Edition, Shadowless and Unlimited printings share an ID. The images for Base Set, Jungle, Fossil, Team Rocket, Gym Heroes and Challenge, and Neo Genesis through Neo Destiny can be 1st Edition scans. Prices there are for the Unlimited printing.
- **Forms** such as Mega, VMAX and ex count toward their Pokémon like any other card. They don't get separate slots.
- **Dropdown styling** uses Chrome's customizable select. Other browsers fall back to their native dropdown.
- **No authentication.** This is a single-user tool meant to run on your own machine or a private network, not on the public internet.

## Credits

- Card data and images from [TCGdex](https://tcgdex.dev)
- Favicon based on an [IconPark](https://github.com/bytedance/IconPark) icon, see [NOTICE.md](NOTICE.md)

Pokémon and the Poké Ball design are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc. This project is not affiliated with or endorsed by them.

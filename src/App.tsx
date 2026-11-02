import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDex } from './api'
import { pageCount } from './binder'
import { GENERATIONS } from './generations'
import { BinderPages } from './components/BinderPages'
import { SearchIcon } from './components/icons'
import { DownloadShoppingList } from './components/DownloadShoppingList'
import { DexCard } from './components/DexCard'
import { GenerationSection } from './components/GenerationSection'
import { ProgressCount } from './components/ProgressCount'
import type { DexEntry } from './types'
import { groupWantedBySet } from './wantedSets'

const BINDER_KEY = 'view:binder'

// Storage can be unavailable or throw, so the toggle then just starts off.
function readBinder() {
  try {
    return localStorage.getItem(BINDER_KEY) === 'on'
  } catch {
    return false
  }
}

function writeBinder(on: boolean) {
  try {
    localStorage.setItem(BINDER_KEY, on ? 'on' : 'off')
  } catch {
    // Not remembering the view is fine.
  }
}

function App() {
  const [binder, setBinder] = useState(readBinder)
  const [search, setSearch] = useState('')
  const [wantedSet, setWantedSet] = useState('')
  const { data, isPending, error } = useQuery({
    queryKey: ['dex'],
    queryFn: fetchDex,
  })

  if (isPending) return <p>Loading...</p>
  if (error) return <p>Something went wrong: {error.message}</p>

  const setOptions = groupWantedBySet(data)
  // A set drops out of the list once its last wanted card is marked owned.
  const activeSet = setOptions.some((set) => set.id === wantedSet) ? wantedSet : ''

  const term = search.trim().toLowerCase()
  const filtering = Boolean(term || activeSet)
  const matches = (entry: DexEntry) =>
    (!activeSet || (entry.status === 'wanted' && entry.set_id === activeSet)) &&
    (!term || entry.name.toLowerCase().includes(term))
  const visible = data.filter(matches)

  // Binder pages are numbered straight through, one generation after another.
  const firstPages: number[] = []
  let nextPage = 1
  for (const generation of GENERATIONS) {
    firstPages.push(nextPage)
    nextPage += pageCount(data.filter((e) => e.dex_id >= generation.first && e.dex_id <= generation.last).length)
  }

  return (
    <>
      <header>
        <h1>Master Dex</h1>
        <ProgressCount entries={data} />
      </header>
      <div className="layout">
        <aside className="sidebar">
          <label className="binder-toggle">
            <input
              type="checkbox"
              role="switch"
              checked={binder}
              onChange={(event) => {
                setBinder(event.target.checked)
                writeBinder(event.target.checked)
              }}
            />
            Binder preview
          </label>
          <DownloadShoppingList sets={setOptions} />
          <div className="search-field">
            <SearchIcon />
            <input
              type="search"
              className="search"
              placeholder="Card name"
              aria-label="Card name"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <nav className="set-list" aria-label="Filter by set">
            <h2>Filter by set</h2>
            <ul>
              {setOptions.map((set) => (
                <li key={set.id}>
                  <button
                    type="button"
                    aria-pressed={activeSet === set.id}
                    onClick={() => setWantedSet(activeSet === set.id ? '' : set.id)}
                  >
                    <span className="set-name">
                      {set.name}
                      {set.abbreviation && <span className="set-abbreviation">{set.abbreviation}</span>}
                    </span>
                    <span className="set-count">{set.entries.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main>
          {filtering && visible.length === 0 && <p>No cards match.</p>}
          {GENERATIONS.map((generation, index) => {
            const inGeneration = (entry: DexEntry) =>
              entry.dex_id >= generation.first && entry.dex_id <= generation.last

            // The grid drops cards that don't match, but a binder keeps every
            // card in its pocket and only dims the others.
            const entries = (binder ? data : visible).filter(inGeneration)
            if (!binder && filtering && entries.length === 0) return null
            return (
              <GenerationSection
                key={generation.number}
                title={`Generation ${generation.number}`}
                subtitle={generation.region}
                entries={entries}
                forceOpen={filtering}
              >
                {binder ? (
                  <BinderPages
                    entries={entries}
                    firstPage={firstPages[index]}
                    matches={filtering ? matches : undefined}
                  />
                ) : (
                  <div className="dex-grid">
                    {entries.map((entry) => (
                      <DexCard key={entry.dex_id} entry={entry} />
                    ))}
                  </div>
                )}
              </GenerationSection>
            )
          })}
        </main>
      </div>
    </>
  )
}

export default App

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDex } from './api'
import { GENERATIONS } from './generations'
import { GenerationSection } from './components/GenerationSection'
import { ProgressCount } from './components/ProgressCount'

function App() {
  const [search, setSearch] = useState('')
  const [wantedSet, setWantedSet] = useState('')
  const { data, isPending, error } = useQuery({
    queryKey: ['dex'],
    queryFn: fetchDex,
  })

  if (isPending) return <p>Loading...</p>
  if (error) return <p>Something went wrong: {error.message}</p>

  // Sets that still have wanted cards, with how many and the lowest dex number
  // wanted in each, so sets holding the oldest generations' cards come first.
  const wantedSets = new Map<
    string,
    { name: string; abbreviation: string | null; count: number; firstDex: number; releaseDate: string }
  >()
  for (const entry of data) {
    if (entry.status !== 'wanted') continue
    const found = wantedSets.get(entry.set_id)
    wantedSets.set(entry.set_id, {
      name: entry.set_name,
      abbreviation: entry.set_abbreviation,
      count: (found?.count ?? 0) + 1,
      firstDex: Math.min(found?.firstDex ?? entry.dex_id, entry.dex_id),
      releaseDate: entry.release_date,
    })
  }
  const setOptions = [...wantedSets].sort(
    (a, b) =>
      a[1].firstDex - b[1].firstDex || a[1].releaseDate.localeCompare(b[1].releaseDate),
  )
  // A set drops out of the list once its last wanted card is marked owned.
  const activeSet = wantedSets.has(wantedSet) ? wantedSet : ''

  const term = search.trim().toLowerCase()
  const visible = data.filter(
    (entry) =>
      (!activeSet || (entry.status === 'wanted' && entry.set_id === activeSet)) &&
      (!term || entry.name.toLowerCase().includes(term)),
  )
  const filtering = Boolean(term || activeSet)

  return (
    <>
      <header>
        <h1>Master Dex</h1>
        <ProgressCount entries={data} />
      </header>
      <div className="layout">
        <aside className="sidebar">
          <input
            type="search"
            className="search"
            placeholder="Search by card name"
            aria-label="Search by card name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <nav className="set-list" aria-label="Filter by set">
            <h2>Filter by set</h2>
            <ul>
              {setOptions.map(([id, set]) => (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={activeSet === id}
                    onClick={() => setWantedSet(activeSet === id ? '' : id)}
                  >
                    <span className="set-name">
                      {set.name}
                      {set.abbreviation && <span className="set-abbreviation">{set.abbreviation}</span>}
                    </span>
                    <span className="set-count">{set.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main>
          {filtering && visible.length === 0 && <p>No cards match.</p>}
          {GENERATIONS.map((generation) => {
            const entries = visible.filter(
              (entry) => entry.dex_id >= generation.first && entry.dex_id <= generation.last,
            )
            if (filtering && entries.length === 0) return null
            return (
              <GenerationSection
                key={generation.number}
                title={`Generation ${generation.number}`}
                subtitle={generation.region}
                entries={entries}
                forceOpen={filtering}
              />
            )
          })}
        </main>
      </div>
    </>
  )
}

export default App

import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchDex } from './api'
import { pageCount } from './binder'
import { GENERATIONS } from './generations'
import { BinderPages } from './components/BinderPages'
import { CloseIcon, MenuIcon, SearchIcon } from './components/icons'
import { DownloadShoppingList } from './components/DownloadShoppingList'
import { DexCard } from './components/DexCard'
import { GenerationSection } from './components/GenerationSection'
import { PriceMovers } from './components/PriceMovers'
import { ProgressCount } from './components/ProgressCount'
import type { DexEntry } from './types'
import { groupWantedBySet } from './wantedSets'
import { showCard } from './showCard'
import { useDrawer } from './hooks/useDrawer'
import { usePauseHoverWhileScrolling } from './hooks/usePauseHoverWhileScrolling'

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
  usePauseHoverWhileScrolling()
  const [binder, setBinder] = useState(readBinder)
  const [search, setSearch] = useState('')
  const [wantedSet, setWantedSet] = useState('')
  const {
    open: drawerOpen,
    menuButton,
    closeButton,
    show: showDrawer,
    hide: hideDrawer,
    dismiss: dismissDrawer,
  } = useDrawer()
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

  // Takes you to a card, e.g. from the price movers list.
  function goToCard(entry: DexEntry) {
    // Close the drawer (on narrow screens it covers the cards), and clear a
    // search or set filter that hides the card (or dims it in the binder).
    // Let that render before looking for the card.
    flushSync(() => {
      hideDrawer()
      if (!matches(entry)) {
        setSearch('')
        setWantedSet('')
      }
    })
    showCard(entry.dex_id)
  }

  // Binder pages are numbered straight through, one generation after another.
  const firstPages: number[] = []
  let nextPage = 1
  for (const generation of GENERATIONS) {
    firstPages.push(nextPage)
    nextPage += pageCount(data.filter((e) => e.dex_id >= generation.first && e.dex_id <= generation.last).length)
  }

  const owned = data.filter((entry) => entry.status === 'owned').length

  return (
    <>
      {/* Narrow screens only: opens the sidebar as a drawer. */}
      <div className="mobile-bar">
        <button
          type="button"
          ref={menuButton}
          className="icon-button"
          aria-label="Open filters"
          aria-expanded={drawerOpen}
          aria-controls="sidebar"
          onClick={showDrawer}
        >
          <MenuIcon />
        </button>
        <span className="mobile-bar-title">Master Dex</span>
        <span className="mobile-bar-count">
          {owned} / {data.length}
        </span>
      </div>
      {drawerOpen && <div className="drawer-backdrop" onClick={dismissDrawer} />}
      <div className="layout">
        <aside id="sidebar" className="sidebar" data-open={drawerOpen}>
          <header className="sidebar-header">
            <h1>Master Dex</h1>
            <button
              type="button"
              ref={closeButton}
              className="icon-button drawer-close"
              aria-label="Close filters"
              onClick={dismissDrawer}
            >
              <CloseIcon />
            </button>
          </header>
          <ProgressCount entries={data} />
          <div className="panel sidebar-tools">
            <div className="sidebar-actions">
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
            </div>
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
          </div>
          <PriceMovers entries={data} onSelect={goToCard} />
          <nav className="panel set-list" aria-label="Filter by set">
            <h2>Filter by set</h2>
            <ul>
              {setOptions.map((set) => (
                <li key={set.id}>
                  <button
                    type="button"
                    aria-pressed={activeSet === set.id}
                    onClick={() => {
                      setWantedSet(activeSet === set.id ? '' : set.id)
                      hideDrawer()
                    }}
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

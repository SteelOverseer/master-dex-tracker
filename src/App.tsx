import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDex } from './api'
import { GENERATIONS } from './generations'
import { GenerationSection } from './components/GenerationSection'
import { ProgressCount } from './components/ProgressCount'

function App() {
  const [search, setSearch] = useState('')
  const { data, isPending, error } = useQuery({
    queryKey: ['dex'],
    queryFn: fetchDex,
  })

  if (isPending) return <p>Loading...</p>
  if (error) return <p>Something went wrong: {error.message}</p>

  const term = search.trim().toLowerCase()
  const visible = term
    ? data.filter((entry) => entry.name.toLowerCase().includes(term))
    : data

  return (
    <main>
      <h1>Master Dex</h1>
      <ProgressCount entries={data} />
      <input
        type="search"
        className="search"
        placeholder="Search by card name"
        aria-label="Search by card name"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {term && visible.length === 0 && <p>No cards match "{search.trim()}".</p>}
      {GENERATIONS.map((generation) => {
        const entries = visible.filter(
          (entry) => entry.dex_id >= generation.first && entry.dex_id <= generation.last,
        )
        if (term && entries.length === 0) return null
        return (
          <GenerationSection
            key={generation.number}
            title={`Generation ${generation.number}`}
            subtitle={generation.region}
            entries={entries}
            forceOpen={Boolean(term)}
          />
        )
      })}
    </main>
  )
}

export default App

import { useQuery } from '@tanstack/react-query'
import { DexCard } from './components/DexCard'
import type { DexEntry } from './types'

async function fetchDex(): Promise<DexEntry[]> {
  const response = await fetch('/api/dex')
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json()
}

function App() {
  const { data, isPending, error } = useQuery({
    queryKey: ['dex'],
    queryFn: fetchDex,
  })

  if (isPending) return <p>Loading...</p>
  if (error) return <p>Something went wrong: {error.message}</p>

  return (
    <main>
      <h1>Master Dex</h1>
      <div className="dex-grid">
        {data.map((entry) => (
          <DexCard key={entry.dex_id} entry={entry} />
        ))}
      </div>
    </main>
  )
}

export default App

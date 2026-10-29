import { useQuery } from '@tanstack/react-query'
import { fetchDex } from './api'
import { DexCard } from './components/DexCard'
import { ProgressCount } from './components/ProgressCount'

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
      <ProgressCount entries={data} />
      <div className="dex-grid">
        {data.map((entry) => (
          <DexCard key={entry.dex_id} entry={entry} />
        ))}
      </div>
    </main>
  )
}

export default App

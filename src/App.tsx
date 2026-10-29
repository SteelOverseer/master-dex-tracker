import { useQuery } from '@tanstack/react-query'
import { fetchDex } from './api'
import { GENERATIONS } from './generations'
import { GenerationSection } from './components/GenerationSection'
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
      {GENERATIONS.map((generation) => (
        <GenerationSection
          key={generation.number}
          title={`Generation ${generation.number}`}
          subtitle={generation.region}
          entries={data.filter(
            (entry) => entry.dex_id >= generation.first && entry.dex_id <= generation.last,
          )}
        />
      ))}
    </main>
  )
}

export default App

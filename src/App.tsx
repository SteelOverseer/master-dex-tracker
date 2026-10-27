import { useEffect, useState } from 'react'
import type { Card } from '@tcgdex/sdk'
import { tcgdex } from './lib/tcgdex'

function App() {
  const [card, setCard] = useState<Card | null>(null)

  useEffect(() => {
    tcgdex.fetch('cards', 'swsh3-136').then((c) => setCard(c ?? null))
    // const res = tcgdex.fetch('dex-ids', '1')
     tcgdex.fetch('sets', 'base1').then((data) => console.log(data))
  }, [])

  if (!card) return <p>Loading...</p>

  return (
    <div>
      <h1>{card.name}</h1>
      {card.image && (
        <img src={`${card.image}/high.webp`} alt={card.name} width={300} />
      )}
    </div>
  )
}

export default App

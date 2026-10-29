import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchPrintings } from '../api'
import { useSaveEntry } from '../hooks/useSaveEntry'
import type { DexEntry, Printing } from '../types'

function optionLabel(printing: Printing) {
  const year = printing.release_date.slice(0, 4)
  return `${printing.set_name} (${year}) - ${printing.name} #${printing.local_id}`
}

export function DexCard({ entry }: { entry: DexEntry }) {
  const [wantsOptions, setWantsOptions] = useState(false)
  const save = useSaveEntry()

  // Only load the printings once the user shows interest in this card.
  const { data: printings } = useQuery({
    queryKey: ['printings', entry.dex_id],
    queryFn: () => fetchPrintings(entry.dex_id),
    enabled: wantsOptions,
  })

  const owned = entry.status === 'owned'

  function toggleOwned() {
    save.mutate({ ...entry, status: owned ? 'wanted' : 'owned' })
  }

  // Choosing a printing means you want that card.
  function selectPrinting(cardId: string) {
    const printing = printings?.find((p) => p.card_id === cardId)
    if (!printing) return
    save.mutate({
      ...entry,
      card_id: printing.card_id,
      local_id: printing.local_id,
      name: printing.name,
      image: printing.image,
      set_name: printing.set_name,
      release_date: printing.release_date,
      status: 'wanted',
    })
  }

  return (
    <figure
      className="dex-card"
      data-owned={owned}
      onPointerEnter={() => setWantsOptions(true)}
      onFocus={() => setWantsOptions(true)}
    >
      <p className="dex-card-title">
        #{entry.dex_id} {entry.name}
      </p>
      <button
        type="button"
        className="dex-card-image"
        aria-pressed={owned}
        onClick={toggleOwned}
      >
        {entry.image ? (
          <img src={`${entry.image}/low.webp`} alt={entry.name} loading="lazy" />
        ) : (
          <span className="dex-card-missing">No image</span>
        )}
      </button>
      <figcaption>
        <select value={entry.card_id} onChange={(e) => selectPrinting(e.target.value)}>
          {printings ? (
            printings.map((p) => (
              <option key={p.card_id} value={p.card_id}>
                {optionLabel(p)}
              </option>
            ))
          ) : (
            <option value={entry.card_id}>{optionLabel(entry)}</option>
          )}
        </select>
      </figcaption>
    </figure>
  )
}

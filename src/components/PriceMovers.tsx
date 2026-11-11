import { formatChange, formatPercent, type PriceMover, wantedPriceMovers } from '../priceChange'
import type { DexEntry } from '../types'

// How many cards each list shows.
const SHOWN = 5

interface ListProps {
  title: string
  movers: PriceMover[]
  onSelect: (entry: DexEntry) => void
}

function MoverList({ title, movers, onSelect }: ListProps) {
  if (movers.length === 0) return null
  return (
    <>
      <h3>
        {title} <span className="price-movers-count">{movers.length}</span>
      </h3>
      <ul>
        {movers.slice(0, SHOWN).map(({ entry, price, change }) => (
          <li key={entry.dex_id} title={`${entry.set_name} #${entry.local_id}`}>
            <button type="button" className="price-movers-name" onClick={() => onSelect(entry)}>
              #{entry.dex_id} {entry.name}
            </button>
            <span className="price-change" data-direction={change > 0 ? 'up' : 'down'}>
              {formatChange(change)} <small>{formatPercent(price, change)}</small>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}

interface Props {
  entries: DexEntry[]
  // Called when a card's name is clicked, to take you to that card.
  onSelect: (entry: DexEntry) => void
}

// The wanted cards whose price moved most over the last week.
export function PriceMovers({ entries, onSelect }: Props) {
  const { up, down } = wantedPriceMovers(entries)

  return (
    <details className="panel price-movers" open>
      <summary>
        <h2>Price movers</h2>
      </summary>
      {up.length === 0 && down.length === 0 ? (
        <p className="price-movers-empty">
          No wanted card has moved in price this week. Changes show up once a price sync finds
          new prices.
        </p>
      ) : (
        <>
          <MoverList title="Up" movers={up} onSelect={onSelect} />
          <MoverList title="Down" movers={down} onSelect={onSelect} />
        </>
      )}
    </details>
  )
}

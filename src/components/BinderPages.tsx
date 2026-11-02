import { BINDER_PAGE, toSpreads } from '../binder'
import { useSaveEntry } from '../hooks/useSaveEntry'
import type { DexEntry } from '../types'

interface Props {
  entries: DexEntry[]
  // The page number of the first page here, counting from the start of the binder.
  firstPage: number
  // When set, cards it rejects are dimmed instead of removed, so every card
  // stays in the pocket it would really be in.
  matches?: (entry: DexEntry) => boolean
}

const priceFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function BinderSlot({ entry, dimmed }: { entry: DexEntry | null; dimmed: boolean }) {
  const save = useSaveEntry()
  if (!entry) return <div className="binder-slot binder-slot-empty" />

  const owned = entry.status === 'owned'
  const price = entry.price === null ? '' : ` · ${priceFormat.format(entry.price)}`

  return (
    <button
      type="button"
      className="binder-slot"
      data-owned={owned}
      data-dimmed={dimmed}
      aria-pressed={owned}
      title={`#${entry.dex_id} ${entry.name} · ${entry.set_name}${price}`}
      onClick={() => save.mutate({ ...entry, status: owned ? 'wanted' : 'owned' })}
    >
      {entry.image ? (
        <img src={`${entry.image}/low.webp`} alt={entry.name} loading="lazy" />
      ) : (
        <span className="binder-slot-missing">
          #{entry.dex_id} {entry.name}
        </span>
      )}
    </button>
  )
}

export function BinderPages({ entries, firstPage, matches }: Props) {
  return (
    <div className="binder">
      {toSpreads(entries).map((spread, spreadIndex) => (
        <div className="binder-spread" key={spreadIndex}>
          {spread.map((page, pageIndex) => (
            <figure className="binder-page" key={pageIndex}>
              <div
                className="binder-grid"
                style={{ gridTemplateColumns: `repeat(${BINDER_PAGE.columns}, 1fr)` }}
              >
                {page.map((entry, slotIndex) => (
                  <BinderSlot
                    key={slotIndex}
                    entry={entry}
                    dimmed={Boolean(entry && matches && !matches(entry))}
                  />
                ))}
              </div>
              <figcaption>Page {firstPage + spreadIndex * 2 + pageIndex}</figcaption>
            </figure>
          ))}
        </div>
      ))}
    </div>
  )
}

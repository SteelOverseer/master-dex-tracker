import type { DexEntry } from '../types'

export function DexCard({ entry }: { entry: DexEntry }) {
  return (
    <figure className="dex-card">
      {entry.image ? (
        <img src={`${entry.image}/low.webp`} alt={entry.name} loading="lazy" />
      ) : (
        <div className="dex-card-missing">No image</div>
      )}
      <figcaption>
        <strong>
          #{entry.dex_id} {entry.name}
        </strong>
        <span>
          {entry.set_name} ({entry.release_date.slice(0, 4)})
        </span>
      </figcaption>
    </figure>
  )
}

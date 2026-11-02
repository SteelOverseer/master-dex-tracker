import { buildShoppingList } from '../shoppingList'
import type { WantedSet } from '../wantedSets'

// Local date as YYYY-MM-DD, so the file name matches the day on your clock.
function today() {
  return new Date().toLocaleDateString('en-CA')
}

export function DownloadShoppingList({ sets }: { sets: WantedSet[] }) {
  function download() {
    const file = new Blob([buildShoppingList(sets)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `shopping-list-${today()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button type="button" className="download-list" disabled={sets.length === 0} onClick={download}>
      Download shopping list
    </button>
  )
}

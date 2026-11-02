// The pocket layout of one binder page. Change these to match another binder,
// e.g. 4 x 3 for a 12-pocket page.
export const BINDER_PAGE = { columns: 3, rows: 3 }

export const POCKETS_PER_PAGE = BINDER_PAGE.columns * BINDER_PAGE.rows

export function pageCount(slots: number) {
  return Math.ceil(slots / POCKETS_PER_PAGE)
}

// Splits items into pages, padding the last one with nulls for the empty
// pockets, then pairs the pages into open-binder spreads.
export function toSpreads<T>(items: T[]): (T | null)[][][] {
  const pages: (T | null)[][] = []
  for (let start = 0; start < items.length; start += POCKETS_PER_PAGE) {
    const page: (T | null)[] = items.slice(start, start + POCKETS_PER_PAGE)
    while (page.length < POCKETS_PER_PAGE) page.push(null)
    pages.push(page)
  }
  const spreads: (T | null)[][][] = []
  for (let index = 0; index < pages.length; index += 2) {
    spreads.push(pages.slice(index, index + 2))
  }
  return spreads
}

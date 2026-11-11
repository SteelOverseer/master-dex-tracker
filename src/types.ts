export type Status = 'wanted' | 'owned'

export interface Printing {
  card_id: string
  local_id: string
  name: string
  image: string | null
  set_name: string
  release_date: string
}

export interface DexEntry extends Printing {
  dex_id: number
  set_id: string
  set_abbreviation: string | null
  status: Status | null
  price: number | null
  // How much the price moved over the last week, in dollars. Null when it
  // barely moved or there's no earlier price to compare with.
  price_change: number | null
}

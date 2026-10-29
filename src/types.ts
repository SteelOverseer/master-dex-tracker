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
  status: Status | null
}

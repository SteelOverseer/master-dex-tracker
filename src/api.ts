import type { DexEntry, Printing } from './types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json()
}

export const fetchDex = () => request<DexEntry[]>('/api/dex')

export const fetchPrintings = (dexId: number) =>
  request<Printing[]>(`/api/dex/${dexId}/printings`)

export const saveEntry = (entry: DexEntry) =>
  request(`/api/dex/${entry.dex_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ card_id: entry.card_id, status: entry.status }),
  })

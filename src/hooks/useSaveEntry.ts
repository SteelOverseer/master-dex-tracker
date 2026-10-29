import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveEntry } from '../api'
import type { DexEntry } from '../types'

// Saves an entry, updating the cached list straight away so the UI feels
// instant, and rolling back if the server rejects it.
export function useSaveEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveEntry,
    onMutate: async (next: DexEntry) => {
      await queryClient.cancelQueries({ queryKey: ['dex'] })
      const previous = queryClient.getQueryData<DexEntry[]>(['dex'])
      queryClient.setQueryData<DexEntry[]>(['dex'], (old) =>
        old?.map((entry) => (entry.dex_id === next.dex_id ? next : entry)),
      )
      return { previous }
    },
    // The server looks up the price of a newly chosen card, so apply it here.
    onSuccess: (saved) => {
      queryClient.setQueryData<DexEntry[]>(['dex'], (old) =>
        old?.map((entry) =>
          entry.dex_id === saved.dex_id && entry.card_id === saved.card_id
            ? { ...entry, price: saved.price }
            : entry,
        ),
      )
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(['dex'], context?.previous)
    },
  })
}

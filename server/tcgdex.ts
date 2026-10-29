import TCGdex from '@tcgdex/sdk'

export const tcgdex = new TCGdex('en')

export const DELAY_MS = Number(process.env.SYNC_DELAY_MS ?? 500)

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Retry a failed request a few times, waiting longer after each failure.
export async function withRetry<T>(request: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await request()
    } catch (error) {
      if (attempt === 4) throw error
      const wait = 2000 * 2 ** (attempt - 1)
      console.warn(`  request failed (attempt ${attempt}), retrying in ${wait}ms`)
      await sleep(wait)
    }
  }
}

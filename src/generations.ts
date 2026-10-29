export interface Generation {
  number: number
  region: string
  first: number
  last: number
}

// National dex ranges for each generation.
export const GENERATIONS: Generation[] = [
  { number: 1, region: 'Kanto', first: 1, last: 151 },
  { number: 2, region: 'Johto', first: 152, last: 251 },
  { number: 3, region: 'Hoenn', first: 252, last: 386 },
  { number: 4, region: 'Sinnoh', first: 387, last: 493 },
  { number: 5, region: 'Unova', first: 494, last: 649 },
  { number: 6, region: 'Kalos', first: 650, last: 721 },
  { number: 7, region: 'Alola', first: 722, last: 809 },
  { number: 8, region: 'Galar', first: 810, last: 905 },
  { number: 9, region: 'Paldea', first: 906, last: 1025 },
]

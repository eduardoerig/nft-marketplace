import type { NftEdition } from '@/api/types'
import { compare } from '@/lib/money'

/** Edição inicial: a mais barata disponível (no Figma, a "1/50" vem selecionada). */
export function defaultEditionId(editions: NftEdition[]) {
  const available = editions.filter((e) => e.available > 0)
  if (available.length === 0) return editions[0].id
  // Em empate de preço fica a primeira da lista (1/50 antes de "Aberta").
  return available.reduce((cheapest, e) => (compare(e.price, cheapest.price) < 0 ? e : cheapest)).id
}

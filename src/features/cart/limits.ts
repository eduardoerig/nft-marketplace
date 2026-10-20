import type { CartItem } from '@/api/types'

/** Quanto dá para comprar desta linha: o menor entre disponível e limite por pedido. */
export function lineLimit(item: CartItem) {
  return Math.min(item.available, item.maxPerOrder)
}

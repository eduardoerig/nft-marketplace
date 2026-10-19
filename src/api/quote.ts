import { api } from './client'
import type { Quote, QuoteInput } from './types'

/** Revalida preços, disponibilidade, cupom e taxas do carrinho atual. */
export function createQuote(input: QuoteInput, signal?: AbortSignal) {
  return api.post<Quote>('/quote', input, { signal }).then((r) => r.data)
}

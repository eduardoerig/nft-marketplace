import { api } from './client'
import type { Order, OrderInput } from './types'

/**
 * Cria o pedido. A mesma `idempotencyKey` com o mesmo corpo devolve o MESMO pedido
 * (reenvio seguro após timeout); com corpo diferente, 409 IDEMPOTENCY_MISMATCH.
 */
export function createOrder(input: OrderInput, idempotencyKey: string) {
  return api
    .post<Order>('/orders', input, { headers: { 'Idempotency-Key': idempotencyKey } })
    .then((r) => r.data)
}

export function getOrder(id: string, signal?: AbortSignal) {
  return api.get<Order>(`/orders/${id}`, { signal }).then((r) => r.data)
}

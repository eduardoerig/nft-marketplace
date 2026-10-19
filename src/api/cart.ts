import { api } from './client'
import type { Cart, CartItemInput, CartItemUpdate, CartMergeInput } from './types'

/** Carrinho do usuário logado ou, sem sessão, do visitante (header X-Cart-Id). */
export function getCart(signal?: AbortSignal) {
  return api.get<Cart>('/cart', { signal }).then((r) => r.data)
}

export function addCartItem(input: CartItemInput) {
  return api.post<Cart>('/cart/items', input).then((r) => r.data)
}

export function updateCartItem(itemId: string, input: CartItemUpdate) {
  return api.patch<Cart>(`/cart/items/${itemId}`, input).then((r) => r.data)
}

export function removeCartItem(itemId: string) {
  return api.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data)
}

/** Ao logar, junta o carrinho do visitante ao do usuário. */
export function mergeCart(input: CartMergeInput) {
  return api.post<Cart>('/cart/merge', input).then((r) => r.data)
}

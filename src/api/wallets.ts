import { api } from './client'
import type { Wallet, WalletInput, WalletUpdate } from './types'

export function listWallets(signal?: AbortSignal) {
  return api.get<Wallet[]>('/wallets', { signal }).then((r) => r.data)
}

export function createWallet(input: WalletInput) {
  return api.post<Wallet>('/wallets', input).then((r) => r.data)
}

export function updateWallet(id: string, input: WalletUpdate) {
  return api.patch<Wallet>(`/wallets/${id}`, input).then((r) => r.data)
}

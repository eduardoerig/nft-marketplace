import { useMutation } from '@tanstack/react-query'
import * as ordersApi from '@/api/orders'
import type { OrderInput, Quote, WalletProvider } from '@/api/types'
import * as walletsApi from '@/api/wallets'
import { idempotencyKeyFor } from '@/lib/idempotency'
import { formatEth } from '@/lib/money'

export function useConnectWallet() {
  return useMutation({
    mutationFn: ({ walletId, provider }: { walletId: string; provider: WalletProvider }) =>
      walletsApi.connectWallet(walletId, provider),
  })
}

/**
 * Cria o pedido. A chave de idempotência sai do conteúdo: cliques repetidos e reenvios usam a mesma.
 * Se a resposta se perder (falha de rede/timeout), tenta de novo sozinho com a MESMA chave — o
 * servidor devolve o pedido que já tinha criado, sem duplicar.
 */
export function useCreateOrder() {
  return useMutation({
    mutationFn: (input: OrderInput) => ordersApi.createOrder(input, idempotencyKeyFor(input)),
    retry: (failures, error) => error.code === 'NETWORK' && failures < 2,
  })
}

/** O que mudou entre a cotação revisada e a atual, em frases ("Golden Beat (1/50): 0.99 → 1.50 ETH"). */
export function describeQuoteChanges(before: Quote, after: Quote): string[] {
  const changes: string[] = []
  const key = (i: Quote['items'][number]) => `${i.nftId}:${i.editionId}`
  const afterItems = new Map(after.items.map((i) => [key(i), i]))
  for (const old of before.items) {
    const now = afterItems.get(key(old))
    const label = `${old.name} (${old.editionName})`
    if (!now) changes.push(`${label} saiu do pedido.`)
    else if (now.unitPrice !== old.unitPrice)
      changes.push(`${label}: ${formatEth(old.unitPrice)} → ${formatEth(now.unitPrice)}.`)
    else if (now.quantity !== old.quantity)
      changes.push(`${label}: ${old.quantity} → ${now.quantity} unidades.`)
  }
  if (before.total !== after.total)
    changes.push(`Total: ${formatEth(before.total)} → ${formatEth(after.total)}.`)
  return changes
}

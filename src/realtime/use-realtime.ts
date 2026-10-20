import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { getToken } from '@/api/client'
import type { Nft, NftUpdatedEvent, Order, OrderUpdatedEvent, RealtimeEvent } from '@/api/types'
import { useSession } from '@/features/auth/queries'
import { queryKeys } from '@/lib/queryKeys'
import { connectSocket } from './socket'

// Duplicatas e eventos antigos: o mesmo eventId nunca é aplicado duas vezes, e um evento com
// versão menor ou igual à já aplicada naquele recurso é ignorado (não regride o estado).
const seenEventIds = new Set<string>()
const lastVersion = new Map<string, number>()

function isNew(event: RealtimeEvent) {
  if (seenEventIds.has(event.eventId)) return false
  seenEventIds.add(event.eventId)
  const key = `${event.type}:${event.resourceId}`
  if (event.version <= (lastVersion.get(key) ?? 0)) return false
  lastVersion.set(key, event.version)
  return true
}

function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const { price, previousPrice, editions } = event.payload
  // Detalhe: atualiza na hora, sem esperar a rede. A versão do cache também protege contra regredir
  // (ex.: o REST já trouxe uma versão mais nova que o evento).
  queryClient.setQueryData<Nft>(queryKeys.nfts.detail(event.resourceId), (nft) =>
    nft && nft.version < event.version
      ? {
          ...nft,
          price,
          previousPrice,
          version: event.version,
          editions: nft.editions.map((edition) => ({
            ...edition,
            ...editions.find((changed) => changed.id === edition.id),
          })),
        }
      : nft,
  )
  // Listas (filtro e ordem por preço podem mudar), carrinho e cotação: busca de novo no REST.
  void queryClient.invalidateQueries({ queryKey: ['nfts', 'list'] })
  void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.featured })
  void queryClient.invalidateQueries({ queryKey: ['cart'] })
  void queryClient.invalidateQueries({ queryKey: ['quote'] })
}

function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent) {
  // Só o dono recebe este evento (o servidor filtra por userId). Atualiza o pedido na hora, sem
  // regredir: um estado terminal (versão maior) nunca volta a "pending".
  queryClient.setQueriesData<Order>({ queryKey: ['order'] }, (order) =>
    order && order.id === event.resourceId && order.version < event.version
      ? { ...order, ...event.payload, version: event.version }
      : order,
  )
  // Confirmado: os itens comprados saíram do carrinho no servidor.
  if (event.payload.status === 'confirmed') {
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: ['quote'] })
  }
}

/**
 * Liga o app ao Socket.IO (montado uma vez no layout raiz). Reconecta como outro usuário quando a
 * sessão muda. Depois de uma reconexão, eventos podem ter se perdido: recarrega do REST tudo que
 * está na tela (reconciliação).
 */
export function useRealtime() {
  const queryClient = useQueryClient()
  const session = useSession()
  const userId = session.data?.user.id ?? null
  const ready = !session.isPending

  useEffect(() => {
    if (!ready) return
    let connectedBefore = false
    const onConnect = () => {
      if (connectedBefore) void queryClient.invalidateQueries({ refetchType: 'active' })
      connectedBefore = true
    }
    const onNftUpdated = (event: NftUpdatedEvent) => {
      if (isNew(event)) applyNftUpdated(queryClient, event)
    }
    const onOrderUpdated = (event: OrderUpdatedEvent) => {
      if (isNew(event)) applyOrderUpdated(queryClient, event)
    }

    let unmounted = false
    let socket: Socket | null = null
    void connectSocket(userId ? getToken() : null).then((s) => {
      if (unmounted) return
      socket = s
      connectedBefore = s.connected
      s.on('connect', onConnect)
      s.on('nft.updated', onNftUpdated)
      s.on('order.updated', onOrderUpdated)
    })
    return () => {
      unmounted = true
      socket?.off('connect', onConnect)
      socket?.off('nft.updated', onNftUpdated)
      socket?.off('order.updated', onOrderUpdated)
    }
  }, [queryClient, ready, userId])
}

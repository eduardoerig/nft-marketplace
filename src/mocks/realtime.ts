// "Servidor" Socket.IO da API simulada. O MSW intercepta o WebSocket que o socket.io-client abre
// em /realtime/ e o @mswjs/socket.io-binding traduz o protocolo do Socket.IO (pacotes "42[...]").
// Por que não /socket.io/ (o padrão): o MSW apaga esse prefixo antes de comparar a URL, e aí ela
// ficaria igual à do WebSocket de recarga do Vite (ws://host/) — o mock engoliria os dois.
// Mudanças no banco simulado passam por `updateNft`, que grava (o REST já responde o valor novo)
// e emite o evento — REST e socket nunca discordam.
import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws, type WebSocketHandlerConnection } from 'msw'
import type { NftEdition, NftUpdatedEvent, RealtimeEvent } from '@/api/types'
import { compare } from '@/lib/money'
import { readDb, updateDb } from './db'

type Connection = {
  client: WebSocketHandlerConnection['client']
  io: ReturnType<typeof toSocketIo>
  userId: string | null // null = visitante (só recebe eventos públicos)
}

const connections = new Set<Connection>()
// Eventos já emitidos, para os testes reenviarem um igual (duplicado) ou um antigo.
const sentEvents = new Map<string, RealtimeEvent>()

/** Dono do token enviado em `auth.token` na conexão. Token ausente ou inválido → visitante. */
function userIdOf(token: unknown) {
  if (typeof token !== 'string') return null
  const session = readDb().sessions.find((s) => s.token === token)
  return session && Date.parse(session.expiresAt) > Date.now() ? session.userId : null
}

export const realtimeHandler = ws.link(/\/realtime\/?$/).addEventListener('connection', (connection) => {
  const conn: Connection = { client: connection.client, io: toSocketIo(connection), userId: null }
  connections.add(conn)

  // O token vem no pacote CONNECT do Socket.IO ("40{...auth}"), que o binding não repassa:
  // lemos o quadro bruto.
  connection.client.addEventListener('message', (event) => {
    if (typeof event.data !== 'string' || !event.data.startsWith('40')) return
    const auth = JSON.parse(event.data.slice(2) || '{}') as { token?: unknown }
    conn.userId = userIdOf(auth.token)
  })
  connection.client.addEventListener('close', () => connections.delete(conn))
})

export function emit(event: RealtimeEvent) {
  sentEvents.set(event.eventId, event)
  for (const conn of connections) {
    // Eventos privados (com userId) vão só para o dono.
    if (!event.userId || event.userId === conn.userId) conn.io.client.emit(event.type, event)
  }
}

/** Reenvia um evento já emitido, idêntico (mesmo eventId e versão). */
export function replay(eventId: string) {
  const event = sentEvents.get(eventId)
  if (event) emit(event)
  return event
}

/** Derruba todas as conexões; o socket.io-client reconecta sozinho. */
export function disconnectAll() {
  for (const conn of connections) conn.client.close()
  connections.clear()
}

export function connectionCount() {
  return connections.size
}

export type NftPatch = { nftId: string; editionId: string; price?: string; available?: number }

/**
 * Muda preço e/ou disponibilidade de uma edição: grava no banco, sobe a `version` do NFT e emite
 * `nft.updated`. `silent` grava sem emitir (simula um evento perdido durante uma desconexão).
 */
export function updateNft(patch: NftPatch, { silent = false } = {}): NftUpdatedEvent | null {
  const nft = updateDb((db) => {
    const nft = db.nfts.find((n) => n.id === patch.nftId)
    const edition = nft?.editions.find((e) => e.id === patch.editionId)
    if (!nft || !edition) return null
    if (patch.price !== undefined) edition.price = patch.price
    if (patch.available !== undefined) edition.available = patch.available
    nft.price = lowestPrice(nft.editions)
    nft.version += 1
    return nft
  })
  if (!nft) return null

  const event: NftUpdatedEvent = {
    eventId: crypto.randomUUID(),
    type: 'nft.updated',
    resourceId: nft.id,
    version: nft.version,
    payload: {
      price: nft.price,
      previousPrice: nft.previousPrice,
      editions: nft.editions.map(({ id, price, available }) => ({ id, price, available })),
    },
  }
  if (!silent) emit(event)
  return event
}

/** Preço do card: o menor entre as edições à venda (ou entre todas, se tudo esgotou). */
function lowestPrice(editions: NftEdition[]) {
  const forSale = editions.filter((e) => e.available > 0)
  const pool = forSale.length > 0 ? forSale : editions
  return pool.reduce((min, e) => (compare(e.price, min) < 0 ? e.price : min), pool[0].price)
}

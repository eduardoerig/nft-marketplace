// /api/orders* — criação do pedido (idempotente, revalidando a cotação), consulta e a "rede" que
// confirma ou recusa o pagamento alguns segundos depois (emitindo order.updated só para o dono).
import { http, HttpResponse } from 'msw'
import { NETWORKS, type Buyer, type Network, type Order, type OrderInput } from '@/api/types'
import { readDb, updateDb, type Db, type MockOrder } from '../db'
import { emit, updateNft } from '../realtime'
import { getScenario } from '../scenarios'
import { EMAIL, requireUser, USERNAME } from './auth'
import { buildQuote, findCart } from './cart'
import { fail, networkDelay, ok } from './respond'

/** O que a API mostra: o pedido sem os campos internos (dono, chave e hash do corpo). */
function toOrder(order: MockOrder): Order {
  const { id, status, version, createdAt, updatedAt, items, subtotal, discount, networkFee, total } = order
  const { network, wallet, transaction, failureReason } = order // (sem userId, chave, hash e resolveAt)
  return {
    ...{ id, status, version, createdAt, updatedAt, items, subtotal, discount, networkFee, total },
    ...{ network, wallet, transaction, failureReason },
  }
}

const RESOLVE_AFTER_MS = 2000 // tempo até a "rede" responder
const EXPLORERS: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}
const scheduled = new Set<string>() // pedidos com timer de resolução nesta aba
const lostResponses = new Set<string>() // cenário order-timeout: chaves cuja 1ª resposta já "se perdeu"

/** Hash fictício e estável da transação (64 hexadecimais), derivado do id do pedido. */
function txHashOf(orderId: string) {
  let hex = ''
  for (let round = 0; hex.length < 64; round++) {
    let hash = 2166136261 ^ round
    for (const char of orderId) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
    hex += (hash >>> 0).toString(16).padStart(8, '0')
  }
  return `0x${hex.slice(0, 64)}`
}

/** Tira do carrinho do dono só o que foi comprado (quantidade a quantidade). */
function removeFromCart(db: Db, order: MockOrder) {
  const cart = db.carts.find((c) => c.userId === order.userId)
  if (!cart) return
  for (const item of order.items) {
    const line = cart.items.find((l) => l.nftId === item.nftId && l.editionId === item.editionId)
    if (line) line.quantity -= item.quantity
  }
  cart.items = cart.items.filter((l) => l.quantity > 0)
}

/**
 * Resolve os pedidos pendentes cujo prazo passou: confirmed (padrão) ou rejected (cenário
 * payment-rejected). Estados terminais nunca mudam. Depois de gravar: estoque menor (nft.updated)
 * e order.updated para o dono.
 */
function resolveDueOrders() {
  const resolved = updateDb((db) => {
    const done: MockOrder[] = []
    for (const order of db.orders) {
      if (order.status !== 'pending' || Date.parse(order.resolveAt) > Date.now()) continue
      const rejected = Boolean(getScenario().rejectPayment)
      order.status = rejected ? 'rejected' : 'confirmed'
      order.version += 1
      order.updatedAt = new Date().toISOString()
      if (rejected) {
        order.failureReason = 'A rede recusou o pagamento: saldo insuficiente na carteira.'
      } else {
        const hash = txHashOf(order.id)
        order.transaction = { hash, explorerUrl: EXPLORERS[order.network] + hash }
        removeFromCart(db, order)
      }
      done.push(structuredClone(order))
    }
    return done
  })

  for (const order of resolved) {
    if (order.status === 'confirmed') {
      for (const item of order.items) {
        const edition = readDb()
          .nfts.find((n) => n.id === item.nftId)
          ?.editions.find((e) => e.id === item.editionId)
        const available = Math.max(0, (edition?.available ?? 0) - item.quantity)
        if (edition) updateNft({ nftId: item.nftId, editionId: item.editionId, available })
      }
    }
    const { status, transaction, failureReason, updatedAt } = order
    emit({
      eventId: crypto.randomUUID(),
      type: 'order.updated',
      resourceId: order.id,
      version: order.version,
      userId: order.userId,
      payload: { status, transaction, failureReason, updatedAt },
    })
  }
}

/** Agenda a resolução nesta aba. Depois de um refresh, o GET reagenda (e resolve se já passou da hora). */
function scheduleResolution(order: MockOrder) {
  if (order.status !== 'pending' || scheduled.has(order.id)) return
  scheduled.add(order.id)
  const wait = Math.max(0, Date.parse(order.resolveAt) - Date.now()) + 20
  setTimeout(() => {
    scheduled.delete(order.id)
    resolveDueOrders()
  }, wait)
}

/** O mesmo corpo sempre dá o mesmo texto (chaves em ordem fixa), para comparar reenvios. */
function requestHashOf(input: Partial<OrderInput>) {
  const { quoteId, couponCode, walletId, network, buyer } = input
  const { displayName, username, email, note } = buyer ?? ({} as Partial<Buyer>)
  return JSON.stringify([
    quoteId,
    couponCode ?? null,
    walletId,
    network,
    displayName,
    username,
    email,
    note ?? '',
  ])
}

function validateBuyer(buyer: Partial<Buyer> | undefined) {
  const fields: Record<string, string> = {}
  if (!/^.{2,40}$/.test(buyer?.displayName?.trim() ?? '')) fields.displayName = 'Use de 2 a 40 caracteres.'
  if (!USERNAME.test(buyer?.username ?? '')) fields.username = 'Use de 3 a 20 letras, números, "." ou "_".'
  if (!EMAIL.test(buyer?.email ?? '')) fields.email = 'Informe um e-mail válido.'
  if ((buyer?.note ?? '').length > 280) fields.note = 'Use até 280 caracteres.'
  return fields
}

export const orderHandlers = [
  // POST /api/orders + Idempotency-Key. Mesma chave + mesmo corpo → o mesmo pedido (sem duplicar).
  http.post('/api/orders', async ({ request }) => {
    await networkDelay()
    const key = request.headers.get('Idempotency-Key')
    if (!key) return fail('VALIDATION', 'Envie o header Idempotency-Key.')
    const input = (await request.json().catch(() => ({}))) as Partial<OrderInput>
    const requestHash = requestHashOf(input)

    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user

      const existing = db.orders.find((o) => o.userId === user.id && o.idempotencyKey === key)
      if (existing) {
        if (existing.requestHash !== requestHash) {
          return fail('CONFLICT', 'Esta chave já foi usada para outro pedido.', {
            reason: 'IDEMPOTENCY_MISMATCH',
          })
        }
        return ok(toOrder(existing))
      }

      const fields = validateBuyer(input.buyer)
      if (!NETWORKS.includes(input.network!)) fields.network = 'Selecione uma rede.'
      if (Object.keys(fields).length > 0) return fail('VALIDATION', 'Confira os campos.', { fields })

      const wallet = db.wallets.find((w) => w.id === input.walletId)
      if (!wallet) return fail('NOT_FOUND', 'Carteira não encontrada.')
      if (wallet.userId !== user.id) return fail('FORBIDDEN', 'Esta carteira não é sua.')
      if (getScenario().disconnectWallet) {
        return fail('CONFLICT', 'A carteira desconectou antes de assinar.', { reason: 'WALLET_DISCONNECTED' })
      }

      // Revalida: a cotação revisada ainda é a atual? (preço, estoque, cupom e taxa)
      const quote = buildQuote(db, findCart(db, { userId: user.id, guestId: null }), input.couponCode)
      if (quote instanceof Response) return quote
      if (quote.quoteId !== input.quoteId) {
        return fail('CONFLICT', 'Os valores mudaram desde a revisão. Confira e confirme de novo.', {
          reason: 'QUOTE_STALE',
        })
      }

      const now = new Date().toISOString()
      const order: MockOrder = {
        id: `ord-${crypto.randomUUID().slice(0, 8)}`,
        status: 'pending',
        version: 1,
        createdAt: now,
        updatedAt: now,
        // Snapshot: o recibo guarda os valores desta cotação; mudanças futuras no catálogo não o alteram.
        items: quote.items,
        subtotal: quote.subtotal,
        discount: quote.discount,
        networkFee: quote.networkFee,
        total: quote.total,
        network: input.network!,
        wallet: { label: wallet.label, address: wallet.address, provider: wallet.provider },
        transaction: null,
        failureReason: null,
        userId: user.id,
        idempotencyKey: key,
        requestHash,
        resolveAt: new Date(Date.now() + RESOLVE_AFTER_MS).toISOString(),
      }
      db.orders.push(order)
      scheduleResolution(order)

      // Cenário order-timeout: o pedido foi criado, mas a resposta "se perde" (o cliente vê falha de
      // rede, como num timeout). O reenvio com a mesma chave recebe este mesmo pedido.
      if (getScenario().loseOrderResponse && !lostResponses.has(key)) {
        lostResponses.add(key)
        return HttpResponse.error()
      }
      return ok(toOrder(order), 201)
    })
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await networkDelay()
    resolveDueOrders() // depois de um refresh, o timer da aba anterior se perdeu
    const db = readDb()
    const user = requireUser(db, request)
    if (user instanceof Response) return user
    const order = db.orders.find((o) => o.id === params.id)
    if (!order) return fail('NOT_FOUND', 'Pedido não encontrado.')
    if (order.userId !== user.id) return fail('FORBIDDEN', 'Este pedido não é seu.')
    scheduleResolution(order)
    return ok(toOrder(order))
  }),
]

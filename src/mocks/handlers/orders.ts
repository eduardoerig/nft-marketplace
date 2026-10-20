// /api/orders* — criação do pedido (idempotente, revalidando a cotação) e consulta.
import { http } from 'msw'
import { NETWORKS, type Buyer, type Order, type OrderInput } from '@/api/types'
import { readDb, updateDb, type MockOrder } from '../db'
import { getScenario } from '../scenarios'
import { EMAIL, requireUser, USERNAME } from './auth'
import { buildQuote, findCart } from './cart'
import { fail, networkDelay, ok } from './respond'

/** O que a API mostra: o pedido sem os campos internos (dono, chave e hash do corpo). */
function toOrder(order: MockOrder): Order {
  const { id, status, version, createdAt, updatedAt, items, subtotal, discount, networkFee, total } = order
  const { network, wallet, transaction, failureReason } = order
  return {
    ...{ id, status, version, createdAt, updatedAt, items, subtotal, discount, networkFee, total },
    ...{ network, wallet, transaction, failureReason },
  }
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
      }
      db.orders.push(order)
      return ok(toOrder(order), 201)
    })
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await networkDelay()
    const db = readDb()
    const user = requireUser(db, request)
    if (user instanceof Response) return user
    const order = db.orders.find((o) => o.id === params.id)
    if (!order) return fail('NOT_FOUND', 'Pedido não encontrado.')
    if (order.userId !== user.id) return fail('FORBIDDEN', 'Este pedido não é seu.')
    return ok(toOrder(order))
  }),
]

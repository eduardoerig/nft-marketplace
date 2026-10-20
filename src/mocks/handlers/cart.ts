// /api/cart* e /api/quote — carrinho do usuário logado ou do visitante (header X-Cart-Id) e a
// cotação que fecha a conta. Toda conta com ETH usa big.js (src/lib/money.ts), igual ao app.
import { http } from 'msw'
import type {
  Cart,
  CartItem,
  CartItemInput,
  CartItemUpdate,
  CartMergeInput,
  Quote,
  QuoteInput,
} from '@/api/types'
import { add, mul, percentOf, sub } from '@/lib/money'
import { readDb, updateDb, type Db, type MockCart, type MockCartLine } from '../db'
import { requireUser } from './auth'
import { fail, networkDelay, ok } from './respond'

const NETWORK_FEE_PER_ITEM = '0.004' // taxa de rede estimada por linha do carrinho
const QUOTE_TTL_MS = 10 * 60 * 1000

/** De quem é o carrinho: usuário (token) ou visitante (X-Cart-Id). Token inválido → 401. */
function cartOwner(db: Db, request: Request) {
  if (request.headers.get('Authorization')) {
    const user = requireUser(db, request)
    return user instanceof Response ? user : { userId: user.id, guestId: null }
  }
  return { userId: null, guestId: request.headers.get('X-Cart-Id') }
}

function findCart(db: Db, owner: { userId: string | null; guestId: string | null }) {
  if (owner.userId) return db.carts.find((c) => c.userId === owner.userId)
  if (owner.guestId) return db.carts.find((c) => c.userId === null && c.id === owner.guestId)
  return undefined
}

function findOrCreateCart(db: Db, owner: { userId: string | null; guestId: string | null }) {
  const existing = findCart(db, owner)
  if (existing) return existing
  const cart: MockCart = {
    id: owner.guestId ?? `cart-${crypto.randomUUID()}`,
    userId: owner.userId,
    items: [],
  }
  db.carts.push(cart)
  return cart
}

function lookup(db: Db, nftId: string, editionId: string) {
  const nft = db.nfts.find((n) => n.id === nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : null
}

/** Quanto dá para ter desta edição num pedido: o menor entre disponível e limite por pedido. */
function limitOf(edition: { available: number; maxPerOrder: number }) {
  return Math.min(edition.available, edition.maxPerOrder)
}

function toItem(db: Db, line: MockCartLine): CartItem | null {
  const found = lookup(db, line.nftId, line.editionId)
  if (!found) return null
  const { nft, edition } = found
  return {
    id: line.id,
    nftId: nft.id,
    editionId: edition.id,
    name: nft.name,
    tokenId: nft.tokenId,
    image: nft.images[0],
    editionName: edition.name,
    unitPrice: edition.price,
    quantity: line.quantity,
    available: edition.available,
    maxPerOrder: edition.maxPerOrder,
    lineTotal: mul(edition.price, line.quantity),
  }
}

function toCart(db: Db, cart: MockCart | undefined): Cart {
  const items = (cart?.items ?? []).map((line) => toItem(db, line)).filter((i): i is CartItem => i !== null)
  return {
    id: cart?.id ?? '',
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: add(...items.map((i) => i.lineTotal)),
  }
}

const outOfStock = (name: string, limit: number) =>
  fail(
    'CONFLICT',
    limit === 0 ? `${name} esgotou nesta edição.` : `${name}: no máximo ${limit} nesta edição.`,
    { reason: 'OUT_OF_STOCK' },
  )

/** Identificador estável da cotação: muda quando muda preço, quantidade, cupom ou taxa. */
function quoteIdOf(content: unknown) {
  let hash = 5381
  for (const char of JSON.stringify(content)) hash = (hash * 33) ^ char.charCodeAt(0)
  return `q_${(hash >>> 0).toString(36)}`
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    await networkDelay()
    const db = readDb()
    const owner = cartOwner(db, request)
    if (owner instanceof Response) return owner
    return ok(toCart(db, findCart(db, owner)))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await networkDelay()
    const input = (await request.json().catch(() => ({}))) as Partial<CartItemInput>
    if (!Number.isInteger(input.quantity) || input.quantity! < 1) {
      return fail('VALIDATION', 'Quantidade inválida.', {
        fields: { quantity: 'Use um número inteiro a partir de 1.' },
      })
    }
    return updateDb((db) => {
      const owner = cartOwner(db, request)
      if (owner instanceof Response) return owner
      const found = lookup(db, input.nftId ?? '', input.editionId ?? '')
      if (!found) return fail('NOT_FOUND', 'NFT ou edição não encontrado.')
      const cart = findOrCreateCart(db, owner)
      const line = cart.items.find((l) => l.nftId === input.nftId && l.editionId === input.editionId)
      const quantity = (line?.quantity ?? 0) + input.quantity!
      const limit = limitOf(found.edition)
      if (quantity > limit) return outOfStock(found.nft.name, limit)
      if (line) line.quantity = quantity
      else
        cart.items.push({
          id: `line-${crypto.randomUUID()}`,
          nftId: input.nftId!,
          editionId: input.editionId!,
          quantity,
        })
      return ok(toCart(db, cart))
    })
  }),

  http.patch('/api/cart/items/:id', async ({ request, params }) => {
    await networkDelay()
    const input = (await request.json().catch(() => ({}))) as Partial<CartItemUpdate>
    if (!Number.isInteger(input.quantity) || input.quantity! < 1) {
      return fail('VALIDATION', 'Quantidade inválida.', {
        fields: { quantity: 'Use um número inteiro a partir de 1.' },
      })
    }
    return updateDb((db) => {
      const owner = cartOwner(db, request)
      if (owner instanceof Response) return owner
      const cart = findCart(db, owner)
      const line = cart?.items.find((l) => l.id === params.id)
      const found = line && lookup(db, line.nftId, line.editionId)
      if (!cart || !line || !found) return fail('NOT_FOUND', 'Item não encontrado no carrinho.')
      const limit = limitOf(found.edition)
      if (input.quantity! > limit) return outOfStock(found.nft.name, limit)
      line.quantity = input.quantity!
      return ok(toCart(db, cart))
    })
  }),

  http.delete('/api/cart/items/:id', async ({ request, params }) => {
    await networkDelay()
    return updateDb((db) => {
      const owner = cartOwner(db, request)
      if (owner instanceof Response) return owner
      const cart = findCart(db, owner)
      if (!cart?.items.some((l) => l.id === params.id))
        return fail('NOT_FOUND', 'Item não encontrado no carrinho.')
      cart.items = cart.items.filter((l) => l.id !== params.id)
      return ok(toCart(db, cart))
    })
  }),

  // Ao logar: os itens do visitante passam para o carrinho do usuário (somando, sem passar do limite).
  http.post('/api/cart/merge', async ({ request }) => {
    await networkDelay()
    const { guestCartId } = (await request.json().catch(() => ({}))) as Partial<CartMergeInput>
    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      const cart = findOrCreateCart(db, { userId: user.id, guestId: null })
      const guest = db.carts.find((c) => c.userId === null && c.id === guestCartId)
      for (const guestLine of guest?.items ?? []) {
        const found = lookup(db, guestLine.nftId, guestLine.editionId)
        if (!found) continue
        const line = cart.items.find(
          (l) => l.nftId === guestLine.nftId && l.editionId === guestLine.editionId,
        )
        const quantity = Math.min((line?.quantity ?? 0) + guestLine.quantity, limitOf(found.edition))
        if (quantity < 1) continue
        if (line) line.quantity = quantity
        else cart.items.push({ ...guestLine, id: `line-${crypto.randomUUID()}`, quantity })
      }
      db.carts = db.carts.filter((c) => c !== guest)
      return ok(toCart(db, cart))
    })
  }),

  // Cotação: a referência de valores (o app não recalcula nada). Funciona para visitante também.
  http.post('/api/quote', async ({ request }) => {
    await networkDelay()
    const input = (await request.json().catch(() => ({}))) as Partial<QuoteInput>
    return updateDb((db) => {
      const owner = cartOwner(db, request)
      if (owner instanceof Response) return owner
      const mockCart = findCart(db, owner)
      const cart = toCart(db, mockCart)
      if (!mockCart || cart.items.length === 0) return fail('VALIDATION', 'O carrinho está vazio.')
      for (const item of cart.items) {
        const limit = Math.min(item.available, item.maxPerOrder)
        if (item.quantity > limit) return outOfStock(item.name, limit)
      }

      let coupon: Quote['coupon'] = null
      const code = input.couponCode?.trim().toUpperCase()
      if (code) {
        const found = db.coupons.find((c) => c.code === code)
        if (!found) {
          return fail('VALIDATION', 'Cupom inválido.', {
            reason: 'COUPON_INVALID',
            fields: { couponCode: 'Este cupom não existe.' },
          })
        }
        if (new Date(found.expiresAt).getTime() <= Date.now()) {
          return fail('VALIDATION', 'Cupom expirado.', {
            reason: 'COUPON_EXPIRED',
            fields: { couponCode: 'Este cupom expirou.' },
          })
        }
        coupon = { code: found.code, percent: found.percent }
      }

      const items = cart.items.map(
        ({ nftId, editionId, name, tokenId, image, editionName, unitPrice, quantity, lineTotal }) => ({
          nftId,
          editionId,
          name,
          tokenId,
          image,
          editionName,
          unitPrice,
          quantity,
          lineTotal,
        }),
      )
      const discount = coupon ? percentOf(cart.subtotal, coupon.percent) : '0'
      const networkFee = mul(NETWORK_FEE_PER_ITEM, items.length)
      const total = add(sub(cart.subtotal, discount), networkFee)
      const quoteId = quoteIdOf({ items, coupon, networkFee })
      // A versão sobe a cada cotação diferente para este carrinho.
      const version =
        mockCart.lastQuote?.id === quoteId
          ? mockCart.lastQuote.version
          : (mockCart.lastQuote?.version ?? 0) + 1
      mockCart.lastQuote = { id: quoteId, version }

      const quote: Quote = {
        quoteId,
        version,
        items,
        subtotal: cart.subtotal,
        coupon,
        discount,
        networkFee,
        total,
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
      }
      return ok(quote)
    })
  }),
]

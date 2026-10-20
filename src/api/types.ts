// Contratos da API — fonte única de tipos (e das listas de valores aceitos) entre transporte (Axios), estado (Query) e interface.
// Regras: valores em ETH são SEMPRE string decimal ("1.19"); quantidades são number inteiro;
// datas são string ISO 8601. Documentação dos endpoints em docs/API.md.

/** Valor em ETH como string decimal, ex.: "26.846". Faça contas só com src/lib/money.ts. */
export type Eth = string

// ---------------------------------------------------------------------------
// Erros
// ---------------------------------------------------------------------------

export type ApiErrorCode =
  | 'VALIDATION' // 422
  | 'UNAUTHORIZED' // 401
  | 'FORBIDDEN' // 403
  | 'NOT_FOUND' // 404
  | 'CONFLICT' // 409
  | 'UNAVAILABLE' // 503 / 5xx
  | 'NETWORK' // só no cliente: sem resposta (offline ou timeout)

/** Detalhe do erro quando o código sozinho não basta para a interface decidir o que fazer. */
export type ApiErrorReason =
  | 'INVALID_CREDENTIALS' // login: e-mail ou senha errados (401)
  | 'SESSION_EXPIRED' // token vencido (401)
  | 'WRONG_PASSWORD' // troca de senha: senha atual errada (422)
  | 'EMAIL_TAKEN' // cadastro/perfil (409)
  | 'USERNAME_TAKEN' // cadastro/perfil (409)
  | 'OUT_OF_STOCK' // carrinho/pedido: edição sem disponibilidade suficiente (409)
  | 'QUOTE_STALE' // pedido: a cotação mudou desde a revisão (409)
  | 'IDEMPOTENCY_MISMATCH' // pedido: mesma chave com corpo diferente (409)
  | 'COUPON_INVALID' // cotação (422)
  | 'COUPON_EXPIRED' // cotação (422)
  | 'WALLET_REJECTED' // conectar carteira: a pessoa recusou na carteira (409)
  | 'WALLET_DISCONNECTED' // pedido: a carteira caiu antes de assinar (409)
  | 'TIMEOUT' // só no cliente
  | 'OFFLINE' // só no cliente

/** Corpo de toda resposta de erro. `fields` traz mensagens por campo de formulário. */
export type ApiErrorBody = {
  code: ApiErrorCode
  reason?: ApiErrorReason
  message: string
  fields?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Paginação
// ---------------------------------------------------------------------------

export type Paginated<T> = {
  items: T[]
  page: number // começa em 1
  pageSize: number
  total: number
}

// ---------------------------------------------------------------------------
// Conta e sessão
// ---------------------------------------------------------------------------

export type User = {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
}

export type Session = {
  token: string
  user: User
  expiresAt: string
}

export type RegisterInput = {
  username: string
  email: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}

/** Tela "Perfil do colecionador". */
export type Profile = User & {
  ensName: string | null // sem o ".eth"
  walletNickname: string | null
}

export type ProfileUpdate = Partial<
  Pick<Profile, 'displayName' | 'username' | 'email' | 'ensName' | 'walletNickname'>
>

/** Imagem do avatar como data URL (ex.: "data:image/png;base64,..."); null remove o avatar. */
export type AvatarUpdate = { dataUrl: string | null }

export type PasswordChange = {
  currentPassword: string
  newPassword: string
}

// ---------------------------------------------------------------------------
// Carteiras
// ---------------------------------------------------------------------------

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]
export type WalletProvider = 'metamask' | 'walletconnect' | 'coinbase'

export type Wallet = {
  id: string
  kind: 'primary' | 'secondary'
  label: string // apelido, ex.: "Principal", "Reserva"
  address: string // 0x…
  network: Network
  provider: WalletProvider
  ensName: string | null
}

/** Resultado de "Conectar carteira" (simulado). */
export type WalletConnection = { walletId: string; provider: WalletProvider; address: string }

export type WalletInput = Omit<Wallet, 'id'>
export type WalletUpdate = Partial<Omit<Wallet, 'id' | 'kind'>>

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
] as const
export type Category = (typeof CATEGORIES)[number]

/** Uma edição à venda de um NFT (pílulas "1/1", "1/10", "1/50", "ABERTA" no Figma). */
export type NftEdition = {
  id: string
  name: string // "1/50", "Aberta"…
  price: Eth
  available: number // 0 = esgotada
  maxPerOrder: number // limite de quantidade por pedido
}

export type Nft = {
  id: string
  name: string // "Emerald Ape #042"
  tokenId: string // "#0042"
  collection: string // "Kurio Apes"
  category: Category
  network: Network
  images: string[] // a primeira é a principal
  description: string
  attributes: string[]
  rating: number // 0–5
  reviewCount: number
  rare: boolean // selo "RARO"
  price: Eth // menor preço entre as edições disponíveis
  previousPrice: Eth | null // preço riscado no card
  editions: NftEdition[]
  listedAt: string
  version: number // aumenta a cada mudança; usado para ignorar eventos antigos
}

export const NFT_SORTS = ['recent', 'price-asc', 'price-desc', 'popular'] as const
export type NftSort = (typeof NFT_SORTS)[number]
/** Abas do catálogo: "Todos os NFTs", "Novos lançamentos", "Em alta". */
export const NFT_VIEWS = ['all', 'new', 'trending'] as const
export type NftView = (typeof NFT_VIEWS)[number]

/** Parâmetros de GET /nfts. Os mesmos ficam na URL do catálogo. */
export type NftListParams = {
  q?: string
  category?: Category
  network?: Network
  minPrice?: Eth
  maxPrice?: Eth
  view?: NftView
  sort?: NftSort
  page?: number
  pageSize?: number
}

/** Lista paginada + contagens para a sidebar de filtros. */
export type NftListResponse = Paginated<Nft> & {
  facets: {
    categories: Record<Category, number>
    networks: Record<Network, number>
  }
}

// ---------------------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------------------

/** Linha do carrinho com os valores ATUAIS do catálogo. */
export type CartItem = {
  id: string
  nftId: string
  editionId: string
  name: string
  tokenId: string
  image: string
  editionName: string
  unitPrice: Eth
  quantity: number
  available: number
  maxPerOrder: number
  lineTotal: Eth
}

export type Cart = {
  id: string // para visitante, é o guestCartId enviado em X-Cart-Id
  items: CartItem[]
  itemCount: number // soma das quantidades (badge do header)
  subtotal: Eth
}

export type CartItemInput = {
  nftId: string
  editionId: string
  quantity: number
}

export type CartItemUpdate = { quantity: number }
export type CartMergeInput = { guestCartId: string }

// ---------------------------------------------------------------------------
// Cotação
// ---------------------------------------------------------------------------

export type QuoteInput = { couponCode?: string }

export type QuoteItem = {
  nftId: string
  editionId: string
  name: string
  tokenId: string
  image: string
  editionName: string
  unitPrice: Eth
  quantity: number
  lineTotal: Eth
}

/** Referência de valores para finalizar o pedido. Muda de `quoteId` quando algo muda. */
export type Quote = {
  quoteId: string
  version: number
  items: QuoteItem[]
  subtotal: Eth
  coupon: { code: string; percent: number } | null
  discount: Eth
  networkFee: Eth
  total: Eth
  expiresAt: string
}

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export type Buyer = {
  displayName: string
  username: string
  email: string
  note?: string
}

/** Corpo de POST /orders. Vai junto o header Idempotency-Key. */
export type OrderInput = {
  quoteId: string // a cotação revisada; se não bater com a atual → 409 QUOTE_STALE
  couponCode?: string // o mesmo cupom da cotação revisada
  walletId: string
  network: Network
  buyer: Buyer
}

/** Pedido com o recibo como snapshot: mudanças posteriores no catálogo não o alteram. */
export type Order = {
  id: string
  status: OrderStatus
  version: number
  createdAt: string
  updatedAt: string
  items: QuoteItem[]
  subtotal: Eth
  discount: Eth
  networkFee: Eth
  total: Eth
  network: Network
  wallet: Pick<Wallet, 'label' | 'address' | 'provider'>
  transaction: { hash: string; explorerUrl: string } | null // só quando confirmado
  failureReason: string | null // só quando recusado
}

// ---------------------------------------------------------------------------
// Tempo real (Socket.IO)
// ---------------------------------------------------------------------------

type EventBase<TType extends string, TPayload> = {
  eventId: string // identidade estável: duplicatas são ignoradas
  type: TType
  resourceId: string
  version: number // eventos com versão <= à já aplicada são ignorados
  userId?: string // presente em eventos privados
  payload: TPayload
}

export type NftUpdatedEvent = EventBase<
  'nft.updated',
  Pick<Nft, 'price' | 'previousPrice'> & {
    editions: Pick<NftEdition, 'id' | 'price' | 'available'>[]
  }
>

export type OrderUpdatedEvent = EventBase<
  'order.updated',
  Pick<Order, 'status' | 'transaction' | 'failureReason' | 'updatedAt'>
>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

import { http } from 'msw'
import {
  CATEGORIES,
  NETWORKS,
  NFT_SORTS,
  NFT_VIEWS,
  type Category,
  type Network,
  type Nft,
  type NftListResponse,
  type NftSort,
  type NftView,
} from '@/api/types'
import { compare } from '@/lib/money'
import { readDb } from '../db'
import { fail, ok } from './respond'

const DECIMAL = /^\d+(\.\d+)?$/
const NEW_WINDOW_MS = 21 * 24 * 60 * 60 * 1000 // "Novos lançamentos": listados nos últimos 21 dias

type Filters = {
  q: string
  category?: Category
  network?: Network
  minPrice?: string
  maxPrice?: string
  view: NftView
}

function matches(nft: Nft, f: Filters, newestListedAt: number) {
  if (f.q) {
    const text = `${nft.name} ${nft.collection}`.toLowerCase()
    if (!text.includes(f.q.toLowerCase())) return false
  }
  if (f.category && nft.category !== f.category) return false
  if (f.network && nft.network !== f.network) return false
  if (f.minPrice && compare(nft.price, f.minPrice) < 0) return false
  if (f.maxPrice && compare(nft.price, f.maxPrice) > 0) return false
  if (f.view === 'new' && newestListedAt - Date.parse(nft.listedAt) > NEW_WINDOW_MS) return false
  if (f.view === 'trending' && nft.rating < 4) return false
  return true
}

function sortNfts(nfts: Nft[], sort: NftSort) {
  const sorted = [...nfts]
  if (sort === 'price-asc') sorted.sort((a, b) => compare(a.price, b.price))
  if (sort === 'price-desc') sorted.sort((a, b) => compare(b.price, a.price))
  if (sort === 'popular') sorted.sort((a, b) => b.reviewCount - a.reviewCount)
  if (sort === 'recent') sorted.sort((a, b) => Date.parse(b.listedAt) - Date.parse(a.listedAt))
  return sorted
}

function countBy<K extends string>(keys: readonly K[], nfts: Nft[], pick: (n: Nft) => K) {
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>
  for (const nft of nfts) counts[pick(nft)] += 1
  return counts
}

export const nftHandlers = [
  // GET /api/nfts?q&category&network&minPrice&maxPrice&view&sort&page&pageSize
  http.get('/api/nfts', async ({ request }) => {
    const params = new URL(request.url).searchParams
    const get = (key: string) => params.get(key) || undefined

    const category = get('category')
    const network = get('network')
    const minPrice = get('minPrice')
    const maxPrice = get('maxPrice')
    const view = get('view') ?? 'all'
    const sort = get('sort') ?? 'recent'
    const page = Number(get('page') ?? 1)
    const pageSize = Number(get('pageSize') ?? 9)

    const fields: Record<string, string> = {}
    if (category && !CATEGORIES.includes(category as Category)) fields.category = 'Categoria inválida.'
    if (network && !NETWORKS.includes(network as Network)) fields.network = 'Rede inválida.'
    if (minPrice && !DECIMAL.test(minPrice)) fields.minPrice = 'Preço mínimo inválido.'
    if (maxPrice && !DECIMAL.test(maxPrice)) fields.maxPrice = 'Preço máximo inválido.'
    if (!NFT_VIEWS.includes(view as NftView)) fields.view = 'Aba inválida.'
    if (!NFT_SORTS.includes(sort as NftSort)) fields.sort = 'Ordenação inválida.'
    if (!Number.isInteger(page) || page < 1) fields.page = 'Página inválida.'
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 48) fields.pageSize = 'Tamanho inválido.'
    if (Object.keys(fields).length) return fail('VALIDATION', 'Parâmetros de busca inválidos.', { fields })

    const { nfts } = readDb()
    const newest = Math.max(...nfts.map((n) => Date.parse(n.listedAt)))
    const filters: Filters = {
      q: get('q') ?? '',
      category: category as Category | undefined,
      network: network as Network | undefined,
      minPrice,
      maxPrice,
      view: view as NftView,
    }

    const filtered = sortNfts(
      nfts.filter((n) => matches(n, filters, newest)),
      sort as NftSort,
    )
    // Contagens da sidebar: cada grupo ignora o próprio filtro (para mostrar as alternativas).
    const withoutCategory = nfts.filter((n) => matches(n, { ...filters, category: undefined }, newest))
    const withoutNetwork = nfts.filter((n) => matches(n, { ...filters, network: undefined }, newest))

    const body: NftListResponse = {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: filtered.length,
      facets: {
        categories: countBy(CATEGORIES, withoutCategory, (n) => n.category),
        networks: countBy(NETWORKS, withoutNetwork, (n) => n.network),
      },
    }
    return ok(body)
  }),

  // Destaques: hero e banner "NFT em destaque" (antes de /:id para não ser confundido com um id).
  http.get('/api/nfts/featured', async () => {
    const { nfts } = readDb()
    return ok(nfts.slice(0, 3))
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    const nft = readDb().nfts.find((n) => n.id === params.id)
    if (!nft) return fail('NOT_FOUND', 'NFT não encontrado.')
    return ok(nft)
  }),
]

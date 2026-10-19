// Estado do catálogo na URL: /?q=…&category=…&page=2. Valores inválidos voltam ao padrão
// (nunca quebram a tela), e os padrões não aparecem na URL (ver stripSearchParams na rota).
import { z } from 'zod'
import {
  CATEGORIES,
  NETWORKS,
  NFT_SORTS,
  NFT_VIEWS,
  type Category,
  type Network,
  type NftListParams,
  type NftSort,
  type NftView,
} from '@/api/types'

const decimal = z.string().regex(/^\d+(\.\d+)?$/)

export const catalogSearchSchema = z.object({
  q: z.string().default('').catch(''),
  category: z.enum(CATEGORIES).optional().catch(undefined),
  network: z.enum(NETWORKS).optional().catch(undefined),
  minPrice: decimal.optional().catch(undefined),
  maxPrice: decimal.optional().catch(undefined),
  view: z.enum(NFT_VIEWS).default('all').catch('all'),
  sort: z.enum(NFT_SORTS).default('recent').catch('recent'),
  page: z.coerce.number().int().min(1).default(1).catch(1),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const catalogSearchDefaults = { q: '', view: 'all', sort: 'recent', page: 1 } as const

export const PAGE_SIZE = 9 // grade 3×3 do Figma

/** Parâmetros enviados ao GET /api/nfts a partir da URL. */
export function toListParams(search: CatalogSearch): NftListParams {
  return {
    q: search.q || undefined,
    category: search.category,
    network: search.network,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    view: search.view,
    sort: search.sort,
    page: search.page,
    pageSize: PAGE_SIZE,
  }
}

export function hasActiveFilters(search: CatalogSearch) {
  return Boolean(search.q || search.category || search.network || search.minPrice || search.maxPrice)
}

// --- Rótulos em português -------------------------------------------------

export const CATEGORY_LABELS: Record<Category, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const VIEW_LABELS: Record<NftView, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

export const SORT_LABELS: Record<NftSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  popular: 'Mais populares',
}

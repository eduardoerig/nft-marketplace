import { api } from './client'
import type { Nft, NftListParams, NftListResponse } from './types'

export function listNfts(params: NftListParams, signal?: AbortSignal) {
  return api.get<NftListResponse>('/nfts', { params, signal }).then((r) => r.data)
}

/** Destaques do hero e o banner "NFT em destaque". */
export function listFeaturedNfts(signal?: AbortSignal) {
  return api.get<Nft[]>('/nfts/featured', { signal }).then((r) => r.data)
}

export function getNft(id: string, signal?: AbortSignal) {
  return api.get<Nft>(`/nfts/${id}`, { signal }).then((r) => r.data)
}

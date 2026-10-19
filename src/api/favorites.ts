import { api } from './client'

/** IDs dos NFTs favoritados pelo usuário logado. */
export function listFavorites(signal?: AbortSignal) {
  return api.get<string[]>('/favorites', { signal }).then((r) => r.data)
}

export function addFavorite(nftId: string) {
  return api.put<string[]>(`/favorites/${nftId}`).then((r) => r.data)
}

export function removeFavorite(nftId: string) {
  return api.delete<string[]>(`/favorites/${nftId}`).then((r) => r.data)
}

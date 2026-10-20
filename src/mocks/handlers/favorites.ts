// /api/favorites* — ids dos NFTs favoritados pelo usuário logado.
import { http } from 'msw'
import { readDb, updateDb } from '../db'
import { getScenario } from '../scenarios'
import { requireUser } from './auth'
import { fail, networkDelay, ok } from './respond'

export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    await networkDelay()
    const db = readDb()
    const user = requireUser(db, request)
    if (user instanceof Response) return user
    return ok(db.favorites[user.id] ?? [])
  }),

  http.put('/api/favorites/:nftId', async ({ request, params }) => {
    await networkDelay()
    if (getScenario().failFavorites) return fail('UNAVAILABLE', 'Não foi possível favoritar agora.')
    const nftId = String(params.nftId)
    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      if (!db.nfts.some((n) => n.id === nftId)) return fail('NOT_FOUND', 'NFT não encontrado.')
      const list = db.favorites[user.id] ?? []
      db.favorites[user.id] = list.includes(nftId) ? list : [...list, nftId]
      return ok(db.favorites[user.id])
    })
  }),

  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    await networkDelay()
    if (getScenario().failFavorites) return fail('UNAVAILABLE', 'Não foi possível remover agora.')
    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
      return ok(db.favorites[user.id])
    })
  }),
]

// /api/favorites* — ids dos NFTs favoritados pelo usuário logado.
import { http } from 'msw'
import { readDb, updateDb } from '../db'
import { requireUser } from './auth'
import { fail, ok } from './respond'

export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    const db = readDb()
    const user = requireUser(db, request)
    if (user instanceof Response) return user
    return ok(db.favorites[user.id] ?? [])
  }),

  http.put('/api/favorites/:nftId', async ({ request, params }) => {
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
    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      db.favorites[user.id] = (db.favorites[user.id] ?? []).filter((id) => id !== params.nftId)
      return ok(db.favorites[user.id])
    })
  }),
]

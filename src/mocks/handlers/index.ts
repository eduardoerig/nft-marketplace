import { http } from 'msw'
import { realtimeHandler } from '../realtime'
import { applyScenario } from '../scenarios'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoriteHandlers } from './favorites'
import { mockControlHandlers } from './mock-control'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

export const handlers = [
  ...mockControlHandlers,
  // Antes de toda rota da API: latência e falhas do cenário atual. Sem falha, devolve undefined e a
  // requisição segue para o handler da rota (é assim que o MSW encadeia handlers).
  http.all('/api/*', ({ request }) => applyScenario(request)),
  ...authHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...nftHandlers,
  realtimeHandler,
]

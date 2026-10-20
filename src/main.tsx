import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { listenForSessionExpiry } from '@/features/auth/session-expiry'
import { queryClient } from '@/lib/queryClient'
import { routeTree } from './routeTree.gen'
import './index.css'

// O queryClient vai no contexto do router para os loaders das rotas usarem o mesmo cache.
const router = createRouter({ routeTree, context: { queryClient }, scrollRestoration: true })

listenForSessionExpiry(router, queryClient)

// Deixa os <Link to="..."> tipados com as rotas reais.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// A API simulada (MSW) liga por configuração — ver .env. O import dinâmico mantém os mocks
// fora do bundle quando desligados; o app só renderiza depois que o worker está pronto.
async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { startMocks } = await import('./mocks/browser')
  await startMocks()
}

enableMocks().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
})

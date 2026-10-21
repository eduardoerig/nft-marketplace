import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { listenForSessionExpiry } from '@/features/auth/session-expiry'
import { setApiFailed, setApiReady } from '@/lib/api-ready'
import { queryClient } from '@/lib/queryClient'
import { routeTree } from './routeTree.gen'
import './index.css'

// O queryClient vai no contexto do router para os loaders das rotas usarem o mesmo cache.
// - defaultPreload 'intent': passar o mouse (ou focar) num link já roda o loader da rota de destino
//   (ex.: o detalhe do NFT começa a carregar antes do clique).
// - defaultPreloadStaleTime 0: quem decide se o dado está fresco é o TanStack Query (staleTime de cada
//   query), não o cache do router — recomendação da doc do router para cache externo.
const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

listenForSessionExpiry(router, queryClient)

// Deixa os <Link to="..."> tipados com as rotas reais.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// A API simulada (MSW) liga por configuração — ver .env. O import dinâmico mantém os mocks fora do
// bundle quando desligados. O app renderiza na hora; as chamadas à API esperam o MSW (apiReady).
async function enableMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { startMocks } = await import('./mocks/browser')
  await startMocks()
}

// Prazo para o MSW ligar. Passou dele (ou o registro do service worker falhou), a tela mostra o erro com
// "Tentar novamente" em vez de skeletons sem fim. Se o MSW ligar depois, o app segue normalmente.
const MOCKS_TIMEOUT_MS = 15_000
const mocksTimeout = setTimeout(setApiFailed, MOCKS_TIMEOUT_MS)

enableMocks().then(
  () => {
    clearTimeout(mocksTimeout)
    setApiReady()
  },
  (error: unknown) => {
    clearTimeout(mocksTimeout)
    console.error('A API simulada (MSW) não ligou.', error)
    setApiFailed()
  },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { routeTree } from './routeTree.gen'
import './index.css'

// O queryClient vai no contexto do router para os loaders das rotas usarem o mesmo cache.
const router = createRouter({ routeTree, context: { queryClient }, scrollRestoration: true })

// Deixa os <Link to="..."> tipados com as rotas reais.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)

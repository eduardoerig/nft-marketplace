import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/client'

// Política de cache (documentada em docs/API.md):
// - staleTime 30s por padrão (catálogo); dados que mudam a todo instante usam 0 na própria query.
// - retry até 2 vezes SÓ em falha transitória (rede/5xx); nunca em 4xx.
// - mutations nunca repetem sozinhas (o reenvio de pedido é manual e idempotente).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => failureCount < 2 && isTransient(error),
    },
    mutations: {
      retry: false,
    },
  },
})

export function isTransient(error: unknown) {
  return error instanceof ApiError && (error.code === 'NETWORK' || error.code === 'UNAVAILABLE')
}

// Faz `error` das queries/mutations ser tipado como ApiError em todo o app.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

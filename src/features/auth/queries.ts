import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import * as authApi from '@/api/auth'
import { ApiError, getToken, setToken } from '@/api/client'
import type { Session } from '@/api/types'
import { queryKeys } from '@/lib/queryKeys'
import { isOnPrivateRoute } from './routing'

// Sessão = token em localStorage + query ['session'] (a fonte de verdade de "quem está logado").
// Sem token, nem chama a API. Token inválido ou vencido → null (o axios já avisou "session-expired").
export const sessionQueryOptions = queryOptions({
  queryKey: queryKeys.session,
  queryFn: async ({ signal }): Promise<Session | null> => {
    if (!getToken()) return null
    try {
      return await authApi.getSession(signal)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        setToken(null)
        return null
      }
      throw error
    }
  },
  staleTime: 60_000,
})

export function useSession() {
  return useQuery(sessionQueryOptions)
}

/**
 * Apaga tudo que é do usuário anterior (carrinho, favoritos, perfil, pedidos…). Fica só o
 * catálogo público. Chamado no login, no logout e quando a sessão expira.
 */
export function clearPrivateData(queryClient: QueryClient) {
  queryClient.removeQueries({
    predicate: (query) => !['nfts', 'session'].includes(String(query.queryKey[0])),
  })
}

/** Grava a nova sessão: token no localStorage, cache privado limpo, ['session'] preenchida. */
function startSession(queryClient: QueryClient, session: Session) {
  setToken(session.token)
  clearPrivateData(queryClient)
  queryClient.setQueryData(queryKeys.session, session)
}

export function endSession(queryClient: QueryClient) {
  setToken(null)
  clearPrivateData(queryClient)
  queryClient.setQueryData(queryKeys.session, null)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => startSession(queryClient, session),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (session) => startSession(queryClient, session),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    // Mesmo se a API falhar, a sessão local acaba: sair nunca pode "não funcionar".
    mutationFn: () => authApi.logout().catch(() => undefined),
    onSettled: async () => {
      // Sai da tela privada ANTES de apagar a sessão, para ela não renderizar sem usuário.
      if (isOnPrivateRoute(router)) await router.navigate({ to: '/' })
      endSession(queryClient)
      toast('Você saiu da sua conta.')
    },
  })
}

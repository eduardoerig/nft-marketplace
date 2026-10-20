import type { QueryClient } from '@tanstack/react-query'
import type { AnyRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { getToken } from '@/api/client'
import { endSession } from './queries'
import { isOnPrivateRoute } from './routing'

/**
 * Escuta o evento `session-expired` (o axios dispara num 401 de requisição autenticada):
 * apaga a sessão e os dados privados, avisa e — se a tela atual for privada — leva ao login
 * guardando a URL para retomar de onde parou.
 * Registrado no main.tsx (e não num componente) para valer já no primeiro carregamento,
 * quando a checagem de sessão roda antes de qualquer tela montar.
 */
export function listenForSessionExpiry(router: AnyRouter, queryClient: QueryClient) {
  window.addEventListener('session-expired', () => {
    if (!getToken()) return // várias requisições podem falhar juntas: trata só a primeira
    endSession(queryClient)
    toast.error('Sua sessão expirou. Entre novamente.')
    if (isOnPrivateRoute(router)) {
      router.navigate({ to: '/login', search: { redirect: router.state.location.href } })
    }
  })
}

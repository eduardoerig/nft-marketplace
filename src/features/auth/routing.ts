import type { AnyRouter } from '@tanstack/react-router'
import { z } from 'zod'

// O modal de login/cadastro é um parâmetro da URL de QUALQUER página: `/nfts/1?auth=login`.
// Assim ele abre por cima da tela atual (o refresh mantém aberto) e fechar só tira o parâmetro.
// `redirect` = para onde ir depois de entrar (quando o login veio de uma rota privada).
export const authSearchSchema = z.object({
  auth: z.enum(['login', 'register']).optional().catch(undefined),
  redirect: z.string().optional().catch(undefined),
})

export type AuthMode = 'login' | 'register'

/** Só aceita caminhos internos ("/account/profile?x=1"), nunca outro site ("//evil.com"). */
export function safeRedirect(redirect: string | undefined) {
  return redirect?.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
}

/** A tela atual exige login? (rotas dentro de src/routes/_auth/) */
export function isOnPrivateRoute(router: AnyRouter) {
  return router.state.matches.some((match) => match.routeId.startsWith('/_auth'))
}

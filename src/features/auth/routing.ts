import type { AnyRouter } from '@tanstack/react-router'
import { z } from 'zod'

// `?redirect=` das telas de login e cadastro: para onde voltar depois de entrar.
export const authSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
})

/** Só aceita caminhos internos ("/account/profile?x=1") — nunca outro site ("//evil.com") nem o próprio login. */
export function safeRedirect(redirect: string | undefined) {
  const internal = redirect?.startsWith('/') && !redirect.startsWith('//')
  const isAuthPage = redirect?.startsWith('/login') || redirect?.startsWith('/register')
  return internal && !isAuthPage ? redirect! : '/'
}

/** A tela atual exige login? (rotas dentro de src/routes/_auth/) */
export function isOnPrivateRoute(router: AnyRouter) {
  return router.state.matches.some((match) => match.routeId.startsWith('/_auth'))
}

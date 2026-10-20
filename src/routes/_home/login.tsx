import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { sessionQueryOptions } from '@/features/auth/queries'
import { authSearchSchema, safeRedirect } from '@/features/auth/routing'

export const Route = createFileRoute('/_home/login')({
  validateSearch: authSearchSchema,
  // Já logado? Não faz sentido mostrar o login: segue direto para o destino.
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (session) throw redirect({ href: safeRedirect(search.redirect), replace: true })
  },
  head: () => ({ meta: [{ title: 'Entrar — Kurio' }] }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  return <AuthDialog mode="login" redirect={redirect} />
}

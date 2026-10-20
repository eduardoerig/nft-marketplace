import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { sessionQueryOptions } from '@/features/auth/queries'
import { authSearchSchema, safeRedirect } from '@/features/auth/routing'

export const Route = createFileRoute('/_home/register')({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (session) throw redirect({ href: safeRedirect(search.redirect), replace: true })
  },
  head: () => ({ meta: [{ title: 'Criar conta — Kurio' }] }),
  component: RegisterPage,
})

function RegisterPage() {
  const { redirect } = Route.useSearch()
  return <AuthDialog mode="register" redirect={redirect} />
}

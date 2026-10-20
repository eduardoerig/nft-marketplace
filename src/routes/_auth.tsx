import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/queries'

// Rota "sem caminho" que agrupa as telas privadas (checkout, pedidos, conta).
// Sem sessão → Início com o modal de login, guardando a URL em `?redirect=` para voltar depois.
// fetchQuery reaproveita a sessão em cache enquanto ela estiver "fresca" (60s) e revalida depois.
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions)
    if (!session) throw redirect({ to: '/', search: { auth: 'login', redirect: location.href } })
    return { session }
  },
  component: Outlet,
})

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/queries'

// Rota "sem caminho" que agrupa as telas privadas (checkout, pedidos, conta).
// Sem sessão → login, guardando a URL atual em `?redirect=` para voltar depois de entrar.
// fetchQuery reaproveita a sessão em cache enquanto ela estiver "fresca" (60s) e revalida depois.
export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery(sessionQueryOptions)
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { session }
  },
  component: Outlet,
})

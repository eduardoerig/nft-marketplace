import { createFileRoute, Outlet } from '@tanstack/react-router'

// Rota "sem caminho" que agrupa as telas privadas (checkout, pedidos, conta).
// O beforeLoad é o ponto onde a sessão será exigida — a proteção real chega no passo 08.
export const Route = createFileRoute('/_auth')({
  beforeLoad: () => {},
  component: Outlet,
})

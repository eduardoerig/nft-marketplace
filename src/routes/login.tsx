import { createFileRoute, redirect } from '@tanstack/react-router'
import { authSearchSchema } from '@/features/auth/routing'

// Endereço curto para o login (links externos, favoritos): abre o modal por cima da Início.
export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema.pick({ redirect: true }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'login', redirect: search.redirect }, replace: true })
  },
})

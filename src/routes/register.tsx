import { createFileRoute, redirect } from '@tanstack/react-router'
import { authSearchSchema } from '@/features/auth/routing'

// Endereço curto para o cadastro: abre o modal por cima da Início.
export const Route = createFileRoute('/register')({
  validateSearch: authSearchSchema.pick({ redirect: true }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'register', redirect: search.redirect }, replace: true })
  },
})

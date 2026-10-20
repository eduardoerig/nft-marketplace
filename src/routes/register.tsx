import { createFileRoute, redirect, type SearchSchemaInput } from '@tanstack/react-router'
import { text } from '@/lib/search-params'

// Endereço curto para o cadastro: abre o modal por cima da Início.
export const Route = createFileRoute('/register')({
  validateSearch: (search: { redirect?: string } & SearchSchemaInput) => ({
    redirect: text(search.redirect),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'register', redirect: search.redirect }, replace: true })
  },
})

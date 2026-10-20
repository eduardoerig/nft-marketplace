import { createFileRoute, redirect, type SearchSchemaInput } from '@tanstack/react-router'
import { text } from '@/lib/search-params'

// Endereço curto para o login (links externos, favoritos): abre o modal por cima da Início.
export const Route = createFileRoute('/login')({
  validateSearch: (search: { redirect?: string } & SearchSchemaInput) => ({
    redirect: text(search.redirect),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/', search: { auth: 'login', redirect: search.redirect }, replace: true })
  },
})

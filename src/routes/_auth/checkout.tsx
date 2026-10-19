import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/_auth/checkout')({
  head: () => ({ meta: [{ title: 'Pagamento — Kurio' }] }),
  component: () => <PagePlaceholder title="Pagamento" step="13" />,
})

import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/_auth/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Confirmação de pedido — Kurio' }] }),
  component: () => <PagePlaceholder title="Confirmação de pedido" step="14" />,
})

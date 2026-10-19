import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/_auth/account/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras — Kurio' }] }),
  component: () => <PagePlaceholder title="Carteiras" step="09" />,
})

import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Carrinho de NFTs — Kurio' }] }),
  component: () => <PagePlaceholder title="Carrinho de NFTs" step="11" />,
})

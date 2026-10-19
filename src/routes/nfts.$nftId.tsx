import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/nfts/$nftId')({
  head: () => ({ meta: [{ title: 'Detalhes do NFT — Kurio' }] }),
  component: () => <PagePlaceholder title="Detalhes do NFT" step="07" />,
})

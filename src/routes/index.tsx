import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Início — Kurio' }] }),
  component: () => <PagePlaceholder title="Início" step="06" />,
})

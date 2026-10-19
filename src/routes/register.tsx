import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/register')({
  head: () => ({ meta: [{ title: 'Criar conta — Kurio' }] }),
  component: () => <PagePlaceholder title="Criar conta" step="08" />,
})

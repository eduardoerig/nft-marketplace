import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Entrar — Kurio' }] }),
  component: () => <PagePlaceholder title="Entrar" step="08" />,
})

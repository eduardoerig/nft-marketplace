import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/_auth/account/profile')({
  head: () => ({ meta: [{ title: 'Perfil do colecionador — Kurio' }] }),
  component: () => <PagePlaceholder title="Perfil do colecionador" step="09" />,
})

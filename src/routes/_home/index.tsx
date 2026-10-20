import { createFileRoute } from '@tanstack/react-router'

// A Início em si é o layout `_home.tsx`; o índice não acrescenta nada por cima.
export const Route = createFileRoute('/_home/')({
  head: () => ({ meta: [{ title: 'Kurio — Marketplace de NFTs' }] }),
})

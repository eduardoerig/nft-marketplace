import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'

const className = 'flex size-[35px] shrink-0 items-center justify-center rounded-full border bg-secondary'

/**
 * Botão "voltar" circular das telas mobile do Figma. Volta no histórico; se a página foi aberta
 * direto (sem histórico no app), leva à Início.
 */
export function BackButton() {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const icon = <img src="/icons/curved-arrow-left-2.svg" alt="" width={20} height={20} />

  return canGoBack ? (
    <button type="button" onClick={() => router.history.back()} aria-label="Voltar" className={className}>
      {icon}
    </button>
  ) : (
    <Link to="/" aria-label="Voltar ao início" className={className}>
      {icon}
    </Link>
  )
}

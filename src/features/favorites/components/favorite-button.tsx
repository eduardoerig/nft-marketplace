import { useNavigate } from '@tanstack/react-router'
import { HeartIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/features/auth/queries'
import { useFavorites, useToggleFavorite } from '../queries'

type Props = {
  nftId: string
  nftName: string
  /** "label": botão com texto "Favoritar" (detalhe desktop). "icon": só o coração (card, detalhe mobile). */
  variant: 'label' | 'icon'
  className?: string
}

/**
 * Botão de favoritar. É um botão "liga/desliga": `aria-pressed` diz se está favoritado.
 * Deslogado, abre o modal de login por cima da página atual.
 */
export function FavoriteButton({ nftId, nftName, variant, className }: Props) {
  const navigate = useNavigate()
  const sessionQuery = useSession()
  const session = sessionQuery.data
  const favoritesQuery = useFavorites()
  const favorites = favoritesQuery.data ?? []
  // Enquanto não se sabe se há sessão (ou, logado, quais são os favoritos), o clique esperaria
  // a resposta errada: abriria o login ou favoritaria algo já favoritado. Então espera.
  const loading = sessionQuery.isPending || (Boolean(session) && favoritesQuery.isPending)
  const toggle = useToggleFavorite()
  const isFavorite = favorites.includes(nftId)

  function onClick() {
    if (!session) {
      navigate({ to: '.', search: (prev) => ({ ...prev, auth: 'login' }) })
      return
    }
    toggle.mutate({ nftId, favorite: !isFavorite })
  }

  const heart = (
    <HeartIcon aria-hidden="true" className={cn('size-5 text-highlight', isFavorite && 'fill-current')} />
  )

  if (variant === 'label') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isFavorite}
        disabled={loading}
        className={cn(
          'flex h-10 w-[130px] items-center justify-center gap-2 rounded-lg border border-primary text-sm font-medium text-highlight',
          className,
        )}
      >
        {heart}
        Favoritar
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isFavorite}
      disabled={loading}
      aria-label={`Favoritar ${nftName}`}
      className={cn('flex items-center justify-center rounded-full bg-secondary', className)}
    >
      {heart}
    </button>
  )
}

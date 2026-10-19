import { useId } from 'react'
import { Link } from '@tanstack/react-router'
import type { NftListResponse } from '@/api/types'
import type { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { PAGE_SIZE } from '../search'
import { NftCard, NftCardSkeleton } from './nft-card'

type Props = {
  data: NftListResponse | undefined
  error: ApiError | null
  isPending: boolean
  isRefreshing: boolean // mostrando a lista anterior enquanto a nova carrega
  onRetry: () => void
}

// Grade de 2 colunas (mobile, com a coluna da direita deslocada como no Figma) ou 3 (desktop).
const gridClass =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 max-md:[&>li:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-x-[34px] md:gap-y-[72px] md:pb-0'

export function NftGrid({ data, error, isPending, isRefreshing, onRetry }: Props) {
  // Mensagem para leitores de tela quando o resultado muda.
  const status = isPending
    ? 'Carregando NFTs…'
    : error
      ? 'Não foi possível carregar os NFTs.'
      : `${data?.total ?? 0} NFTs encontrados.`

  return (
    <div>
      <p role="status" className="sr-only">
        {status}
      </p>

      {isPending ? (
        <ul className={gridClass} aria-label="Carregando NFTs">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <li key={i}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : error && !data ? (
        <ErrorState onRetry={onRetry} />
      ) : data && data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {error && <ErrorState onRetry={onRetry} compact />}
          <ul
            aria-label="NFTs"
            aria-busy={isRefreshing}
            className={`${gridClass} transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}
          >
            {data?.items.map((nft) => (
              <li key={nft.id}>
                <NftCard nft={nft} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function EmptyState() {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
      <h3 id={id} className="text-lg font-bold">
        Nenhum NFT encontrado
      </h3>
      <p className="max-w-sm text-sm/6 text-muted-foreground">
        Tente outra busca ou remova alguns filtros para ver mais resultados.
      </p>
      <Button asChild variant="outline">
        <Link to="/" resetScroll={false} activeOptions={{ exact: true }}>
          Limpar filtros
        </Link>
      </Button>
    </section>
  )
}

function ErrorState({ onRetry, compact = false }: { onRetry: () => void; compact?: boolean }) {
  return (
    <div
      role="alert"
      className={
        compact
          ? 'mb-6 flex items-center justify-between gap-4 border border-destructive/60 px-4 py-3 text-sm'
          : 'flex flex-col items-center gap-4 bg-card px-6 py-16 text-center'
      }
    >
      <p className={compact ? '' : 'text-lg font-bold'}>Não foi possível carregar os NFTs.</p>
      <Button onClick={onRetry} size={compact ? 'sm' : 'default'}>
        Tentar novamente
      </Button>
    </div>
  )
}

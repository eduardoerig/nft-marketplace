import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/types'
import { formatEth } from '@/lib/money'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ComingSoonButton } from '@/components/layout/coming-soon'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'

// Card do catálogo. Desktop: moldura 258×300 com a arte 250×250; mobile: card arredondado com
// gradiente. Imagem e texto são um link para o detalhe; os botões ficam AO LADO do link (botão
// dentro de um link não é HTML válido) e são posicionados por cima da imagem.
export function NftCard({ nft }: { nft: Nft }) {
  return (
    <div className="group relative">
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="group flex flex-col gap-2 rounded-3xl focus-visible:ring-3 focus-visible:ring-ring/60 md:gap-3 md:rounded-none"
      >
        <div className="relative flex aspect-175/200 items-center justify-center rounded-3xl bg-linear-to-b from-card to-secondary p-1 md:aspect-258/300 md:rounded-none md:bg-card md:p-1">
          <img
            src={nft.images[0]}
            alt=""
            width={250}
            height={250}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
          {nft.rare && (
            <span className="absolute top-0 left-0 bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground md:top-3">
              RARO
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
          <h3 className="text-[15px] md:text-base/4">{nft.name}</h3>
          <p className="text-base/4 font-bold text-highlight">
            {formatEth(nft.price)}
            {nft.previousPrice && (
              <>
                <span className="sr-only">, antes </span>
                <s className="ml-3 font-normal whitespace-nowrap text-muted-foreground">
                  {formatEth(nft.previousPrice)}
                </s>
              </>
            )}
          </p>
        </div>
      </Link>
      {/* Mobile (Figma): só o coração redondo no canto da imagem. */}
      <FavoriteButton
        nftId={nft.id}
        nftName={nft.name}
        variant="icon"
        className="absolute top-3 right-3 size-8 bg-background/80 md:hidden"
      />
      <HoverActions nft={nft} />
    </div>
  )
}

const actionClass = 'flex size-[42px] items-center justify-center rounded-[4px] border border-border bg-card'

/**
 * Desktop (Figma): carrinho · favoritar · ver, centralizados na borda de baixo da imagem.
 * Aparecem no hover e no foco do teclado; ficam visíveis se o NFT já é favorito.
 * A camada tem o tamanho da moldura da imagem só para posicionar a fileira.
 */
function HoverActions({ nft }: { nft: Nft }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 aspect-258/300 max-md:hidden">
      <div className="pointer-events-auto absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-[[aria-pressed=true]]:opacity-100 motion-reduce:transition-none">
        {/* O carrinho chega no passo 11. */}
        <ComingSoonButton className={cn(actionClass, 'opacity-100')}>
          <img src="/icons/cart-icon.svg" alt="" width={22} height={21} />
          <span className="sr-only">Adicionar {nft.name} ao carrinho</span>
        </ComingSoonButton>
        <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" className={actionClass} />
        {/* Atalho de mouse: o card inteiro já é um link para o detalhe, então este fica fora do Tab. */}
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          tabIndex={-1}
          aria-hidden="true"
          className={actionClass}
        >
          <img src="/icons/search-icon.svg" alt="" width={20} height={20} />
        </Link>
      </div>
    </div>
  )
}

/** Mesmo tamanho do card real, para a página não "pular" quando os dados chegam. */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3">
      <Skeleton className="aspect-175/200 rounded-3xl md:aspect-258/300 md:rounded-none" />
      <div className="flex flex-col gap-1 pl-2 md:gap-3 md:pl-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/types'
import { formatEth } from '@/lib/money'
import { imageSrcSet } from '@/lib/images'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAddToCartAction } from '@/features/cart/use-add-to-cart'
import { defaultEditionId } from '@/features/nft/editions'
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
            srcSet={imageSrcSet(nft.images[0])}
            sizes="(min-width: 768px) 250px, 45vw"
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
          {/* Cada preço fica inteiro ("1.99 ETH"); se os dois não cabem (card mobile), o antigo desce de linha. */}
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-base/4 font-bold text-highlight">
            <span className="whitespace-nowrap">{formatEth(nft.price)}</span>
            {nft.previousPrice && (
              <>
                <span className="sr-only">, antes </span>
                <s className="text-sm/4 font-normal whitespace-nowrap text-muted-foreground md:text-base/4">
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
 * Aparecem só no hover do mouse e no foco do TECLADO (:focus-visible) — um clique com o mouse
 * deixa o foco no botão, e com :focus-within a fileira ficaria aberta depois que o mouse sai.
 * A camada tem o tamanho da moldura da imagem só para posicionar a fileira.
 */
function HoverActions({ nft }: { nft: Nft }) {
  const { add, isPending } = useAddToCartAction()
  // Do card vai 1 unidade da edição que o detalhe abriria (a mais barata disponível).
  const soldOut = nft.editions.every((e) => e.available === 0)

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 aspect-258/300 max-md:hidden">
      <div className="pointer-events-auto absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-3 opacity-0 transition-opacity group-hover:opacity-100 group-has-focus-visible:opacity-100 motion-reduce:transition-none">
        <button
          type="button"
          onClick={() => add({ nftId: nft.id, editionId: defaultEditionId(nft.editions), quantity: 1 })}
          disabled={soldOut || isPending}
          aria-label={soldOut ? `${nft.name} esgotado` : `Adicionar ${nft.name} ao carrinho`}
          className={cn(actionClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
        >
          <img src="/icons/cart-icon.svg" alt="" width={22} height={21} />
        </button>
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

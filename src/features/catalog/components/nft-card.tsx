import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/types'
import { formatEth } from '@/lib/money'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'

// Card do catálogo. Desktop: moldura 258×300 com a arte 250×250; mobile: card arredondado com
// gradiente. Imagem e texto são um link para o detalhe; o coração fica AO LADO do link (um botão
// dentro de um link não é HTML válido) e é posicionado por cima da imagem.
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
      {/* Mobile: sempre visível. Desktop: aparece no hover/foco, ou fica fixo se já favoritado. */}
      <FavoriteButton
        nftId={nft.id}
        nftName={nft.name}
        variant="icon"
        className="absolute top-3 right-3 size-8 bg-background/80 md:top-4 md:right-4 md:size-9 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:aria-pressed:opacity-100"
      />
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

import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedNfts } from '../queries'

// "NFT em destaque — oferta limitada", abaixo dos filtros (só desktop, como no Figma).
export function FeaturedBanner() {
  const { data: featured } = useFeaturedNfts()
  const nft = featured?.[1] ?? featured?.[0]

  return (
    <section
      aria-labelledby="destaque-titulo"
      className="flex flex-col gap-4 bg-linear-to-b from-primary/10 to-primary/3 pt-6 pb-1"
    >
      <div className="flex flex-col gap-4 px-5">
        <h2 id="destaque-titulo" className="text-2xl/8 font-bold text-highlight">
          NFT EM DESTAQUE
        </h2>
        <p className="text-center text-[22px]/4 font-bold">OFERTA LIMITADA</p>
      </div>
      {nft ? (
        <Link to="/nfts/$nftId" params={{ nftId: nft.id }} aria-label={`Ver ${nft.name} em destaque`}>
          <img
            src={nft.images[0]}
            alt={nft.name}
            width={310}
            height={368}
            loading="lazy"
            className="aspect-310/368 w-full rounded-[22px] object-cover"
          />
        </Link>
      ) : (
        <Skeleton className="aspect-310/368 w-full rounded-[22px]" />
      )}
    </section>
  )
}

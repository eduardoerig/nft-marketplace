import type { Nft } from '@/api/types'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useNfts } from '@/features/catalog/queries'

// "Mais desta coleção": NFTs da mesma categoria (sem o atual), mais populares primeiro.
export function RelatedNfts({ nft }: { nft: Nft }) {
  const { data, isPending } = useNfts({ category: nft.category, sort: 'popular', pageSize: 6 })
  const related = data?.items.filter((n) => n.id !== nft.id).slice(0, 5) ?? []
  if (!isPending && related.length === 0) return null

  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <h2
        id="relacionados-titulo"
        className="border-b border-primary/30 pb-3 text-[17px]/4 font-bold text-highlight"
      >
        Mais desta coleção
      </h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-7 md:overflow-visible md:px-0">
        {isPending
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="w-[45%] shrink-0 md:w-auto">
                <NftCardSkeleton />
              </li>
            ))
          : related.map((item) => (
              <li key={item.id} className="w-[45%] shrink-0 snap-start md:w-auto">
                <NftCard nft={item} />
              </li>
            ))}
      </ul>
    </section>
  )
}

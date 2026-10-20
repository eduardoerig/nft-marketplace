import type { NftListParams } from '@/api/types'
import { useNfts } from '../queries'
import { NftCard, NftCardSkeleton } from './nft-card'

type Props = {
  id: string // prefixo do id do título (aria-labelledby)
  title: string
  params: NftListParams
  excludeId?: string // não mostrar este NFT (ex.: o que está aberto no detalhe)
}

// Prateleira de 5 NFTs do Figma ("Mais desta coleção", "Colecionadores também viram"):
// grade de 5 no desktop, rolagem lateral no mobile.
export function NftShelf({ id, title, params, excludeId }: Props) {
  const { data, isPending } = useNfts({ ...params, pageSize: 6 })
  const items = data?.items.filter((n) => n.id !== excludeId).slice(0, 5) ?? []
  if (!isPending && items.length === 0) return null
  const titleId = `${id}-titulo`

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-8">
      <h2 id={titleId} className="border-b border-primary/30 pb-3 text-[17px]/4 font-bold text-highlight">
        {title}
      </h2>
      <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-7 md:overflow-visible md:px-0">
        {isPending
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="w-[45%] shrink-0 md:w-auto">
                <NftCardSkeleton />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id} className="w-[45%] shrink-0 snap-start md:w-auto">
                <NftCard nft={item} />
              </li>
            ))}
      </ul>
    </section>
  )
}

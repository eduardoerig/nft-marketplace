import { createFileRoute } from '@tanstack/react-router'
import { NftDetail } from '@/features/nft/components/nft-detail'
import { NftDetailSkeleton, NftLoadError, NftNotFound } from '@/features/nft/components/nft-detail-states'
import { nftQueryOptions, useNft } from '@/features/nft/queries'

export const Route = createFileRoute('/nfts/$nftId')({
  // Começa a buscar o NFT já na navegação (sem esperar): o skeleton aparece na hora.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftQueryOptions(params.nftId))
  },
  head: () => ({ meta: [{ title: 'Detalhes do NFT — Kurio' }] }),
  component: NftPage,
})

function NftPage() {
  const { nftId } = Route.useParams()
  const { data: nft, error, isPending, refetch } = useNft(nftId)

  if (isPending) return <NftDetailSkeleton />
  if (error?.code === 'NOT_FOUND') return <NftNotFound />
  if (error) return <NftLoadError onRetry={() => refetch()} />
  // key: ao trocar de NFT (ex.: "Mais desta coleção"), edição e quantidade recomeçam.
  return <NftDetail key={nft.id} nft={nft} />
}

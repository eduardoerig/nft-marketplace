import { queryOptions, useQuery } from '@tanstack/react-query'
import { getNft } from '@/api/nfts'
import { queryKeys } from '@/lib/queryKeys'

// queryOptions reaproveitável: a rota usa para pré-carregar, o componente para ler.
export const nftQueryOptions = (id: string) =>
  queryOptions({
    queryKey: queryKeys.nfts.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
  })

export function useNft(id: string) {
  return useQuery(nftQueryOptions(id))
}

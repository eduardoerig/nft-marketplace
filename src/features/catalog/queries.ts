import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listFeaturedNfts, listNfts } from '@/api/nfts'
import type { NftListParams } from '@/api/types'
import { queryKeys } from '@/lib/queryKeys'

/**
 * Lista do catálogo. A chave inclui os parâmetros (cada combinação tem seu cache), o `signal`
 * cancela a requisição anterior quando os filtros mudam (resposta fora de ordem nunca vence), e
 * `keepPreviousData` mantém a lista antiga visível enquanto a nova carrega.
 */
export function useNfts(params: NftListParams) {
  return useQuery({
    queryKey: queryKeys.nfts.list(params),
    queryFn: ({ signal }) => listNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useFeaturedNfts() {
  return useQuery({
    queryKey: queryKeys.nfts.featured,
    queryFn: ({ signal }) => listFeaturedNfts(signal),
  })
}

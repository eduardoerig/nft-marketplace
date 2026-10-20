import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as favoritesApi from '@/api/favorites'
import { queryKeys } from '@/lib/queryKeys'
import { useSession } from '@/features/auth/queries'

/** Ids dos NFTs favoritados. Deslogado: lista vazia, sem chamar a API. */
export function useFavorites() {
  const userId = useSession().data?.user.id
  return useQuery({
    queryKey: queryKeys.favorites(userId ?? ''),
    queryFn: ({ signal }) => favoritesApi.listFavorites(signal),
    enabled: Boolean(userId),
  })
}

/** A lista com o NFT marcado (favorite = true) ou desmarcado, sem duplicar. */
function setFavorite(list: string[] = [], nftId: string, favorite: boolean) {
  const others = list.filter((id) => id !== nftId)
  return favorite ? [...others, nftId] : others
}

/**
 * Favoritar/desfavoritar com ATUALIZAÇÃO OTIMISTA:
 * - onMutate: o coração muda na hora (o cache recebe a lista já alterada);
 * - onError: desfaz ESTA mudança (rollback) e avisa. Desfaz a mudança em vez de restaurar uma cópia
 *   da lista: funciona mesmo com outros cliques no meio e se a lista ainda não tinha carregado;
 * - onSettled: busca a lista do servidor para confirmar.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const userId = useSession().data?.user.id ?? ''
  const key = queryKeys.favorites(userId)

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favorite ? favoritesApi.addFavorite(nftId) : favoritesApi.removeFavorite(nftId),
    onMutate: async ({ nftId, favorite }) => {
      // Cancela uma busca em andamento: ela traria a lista antiga por cima da otimista.
      await queryClient.cancelQueries({ queryKey: key })
      queryClient.setQueryData<string[]>(key, (list) => setFavorite(list, nftId, favorite))
    },
    onError: (_error, { nftId, favorite }) => {
      queryClient.setQueryData<string[]>(key, (list) => setFavorite(list, nftId, !favorite))
      toast.error(
        favorite ? 'Não foi possível favoritar. Tente de novo.' : 'Não foi possível remover dos favoritos.',
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

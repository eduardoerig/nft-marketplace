import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as profileApi from '@/api/profile'
import * as walletsApi from '@/api/wallets'
import { queryKeys } from '@/lib/queryKeys'
import { useSession } from '@/features/auth/queries'

// Perfil e carteiras são privados: a chave leva o id do usuário (troca de conta nunca reaproveita).
export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.profile(userId),
    queryFn: ({ signal }) => profileApi.getProfile(signal),
  })

export const walletsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => walletsApi.listWallets(signal),
  })

/** Id do usuário logado. As telas de conta só abrem com sessão (src/routes/_auth.tsx). */
function useUserId() {
  return useSession().data?.user.id ?? ''
}

export function useProfile() {
  const userId = useUserId()
  return useQuery({ ...profileQueryOptions(userId), enabled: Boolean(userId) })
}

export function useWallets() {
  const userId = useUserId()
  return useQuery({ ...walletsQueryOptions(userId), enabled: Boolean(userId) })
}

/**
 * Depois de salvar: o perfil novo vai direto para o cache e a sessão é revalidada
 * (o header mostra nome e avatar a partir dela).
 */
function useProfileMutation<TInput>(mutationFn: (input: TInput) => ReturnType<typeof profileApi.getProfile>) {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    mutationFn,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile(userId), profile)
      return queryClient.invalidateQueries({ queryKey: queryKeys.session })
    },
  })
}

export const useUpdateProfile = () => useProfileMutation(profileApi.updateProfile)
export const useUpdateAvatar = () => useProfileMutation(profileApi.updateAvatar)

export function useChangePassword() {
  return useMutation({ mutationFn: profileApi.changePassword })
}

export function useSaveWallet() {
  const queryClient = useQueryClient()
  const userId = useUserId()
  return useMutation({
    // Com id: edita. Sem id: cadastra (principal ou secundária).
    mutationFn: ({ id, input }: { id?: string; input: Parameters<typeof walletsApi.createWallet>[0] }) =>
      id ? walletsApi.updateWallet(id, input) : walletsApi.createWallet(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets(userId) }),
  })
}

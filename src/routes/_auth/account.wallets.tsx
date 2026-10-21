import { createFileRoute } from '@tanstack/react-router'
import { AccountFormSkeleton, AccountLoadError } from '@/features/account/components/account-states'
import { WalletSection } from '@/features/account/components/wallet-section'
import { profileQueryOptions, useProfile, useWallets, walletsQueryOptions } from '@/features/account/queries'

export const Route = createFileRoute('/_auth/account/wallets')({
  // Carteiras e perfil (o perfil preenche nome, perfil e e-mail de uma carteira nova).
  loader: ({ context }) => {
    const userId = context.session.user.id
    void context.queryClient.prefetchQuery(walletsQueryOptions(userId))
    void context.queryClient.prefetchQuery(profileQueryOptions(userId))
  },
  head: () => ({ meta: [{ title: 'Carteiras — Kurio' }] }),
  component: WalletsPage,
})

function WalletsPage() {
  const wallets = useWallets()
  const profile = useProfile()
  const primary = wallets.data?.find((w) => w.kind === 'primary')
  const secondary = wallets.data?.find((w) => w.kind === 'secondary')
  const error = wallets.error ?? profile.error

  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Carteiras</h1>
      {wallets.isPending || profile.isPending ? (
        <AccountFormSkeleton label="Carregando carteiras" />
      ) : error ? (
        <AccountLoadError
          error={error}
          onRetry={() => {
            void wallets.refetch()
            void profile.refetch()
          }}
        />
      ) : (
        <>
          <WalletSection kind="primary" wallet={primary} profile={profile.data} />
          <WalletSection kind="secondary" wallet={secondary} primary={primary} profile={profile.data} />
        </>
      )}
    </div>
  )
}

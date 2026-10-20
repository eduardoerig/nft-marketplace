import { createFileRoute } from '@tanstack/react-router'
import { AccountFormSkeleton, AccountLoadError } from '@/features/account/components/account-states'
import { WalletSection } from '@/features/account/components/wallet-section'
import { useWallets, walletsQueryOptions } from '@/features/account/queries'

export const Route = createFileRoute('/_auth/account/wallets')({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(walletsQueryOptions(context.session.user.id))
  },
  head: () => ({ meta: [{ title: 'Carteiras — Kurio' }] }),
  component: WalletsPage,
})

function WalletsPage() {
  const { data: wallets, error, isPending, refetch } = useWallets()
  const primary = wallets?.find((w) => w.kind === 'primary')
  const secondary = wallets?.find((w) => w.kind === 'secondary')

  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Carteiras</h1>
      {isPending ? (
        <AccountFormSkeleton label="Carregando carteiras" />
      ) : error ? (
        <AccountLoadError onRetry={() => refetch()} />
      ) : (
        <>
          <WalletSection kind="primary" wallet={primary} />
          <WalletSection kind="secondary" wallet={secondary} primary={primary} />
        </>
      )}
    </div>
  )
}

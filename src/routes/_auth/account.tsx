import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AccountNav } from '@/features/account/components/account-nav'

// Layout das telas de conta (/account/profile e /account/wallets): menu "Meu perfil" + conteúdo.
export const Route = createFileRoute('/_auth/account')({
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <div className="flex flex-col gap-6 pt-8 lg:flex-row lg:gap-7">
      <AccountNav />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

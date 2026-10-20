import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { AccountMenu } from '@/features/auth/components/account-menu'
import { ComingSoon } from './coming-soon'
import { MobileMenu } from './mobile-menu'
import { NAV_ITEMS } from './nav-items'

export function SiteHeader() {
  const pathname = useLocation({ select: (l) => l.pathname })

  // No mobile (< 768px) o Figma não tem header: a navegação é a barra inferior (MobileTabBar).
  // Tablet (768–1023px) mantém o header com o menu ☰; desktop, a navegação completa.
  return (
    <header className="mx-auto w-full max-w-page px-4 pt-6 max-md:hidden lg:px-0">
      <div className="flex h-[45px] items-center justify-between border-b border-primary/30">
        <Link to="/" className="w-40 text-sm font-bold tracking-[0.1em]" aria-label="Kurio, página inicial">
          KURIO
        </Link>

        <nav aria-label="Principal" className="hidden h-full lg:block">
          <ul className="flex h-full gap-10">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive?.(pathname) ?? false
              return (
                <li key={item.label} className="flex h-full items-center">
                  {item.to ? (
                    <Link
                      to={item.to}
                      hash={item.hash}
                      activeOptions={{ includeHash: true }}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        // Borda transparente em cima e embaixo: o texto fica centrado na barra (alinhado ao
                        // logo e aos ícones) e o sublinhado do ativo encosta na linha divisória.
                        'flex h-full items-center border-y-3 border-transparent text-base',
                        active && 'border-b-primary font-bold text-highlight',
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <ComingSoon className="text-base">{item.label}</ComingSoon>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-4 lg:gap-7">
          <Link
            to="/"
            hash="busca"
            activeOptions={{ includeHash: true }}
            aria-label="Buscar NFTs"
            className="hidden lg:block"
          >
            <img src="/icons/search-icon.svg" alt="" width={20} height={20} />
          </Link>
          <Link to="/cart" aria-label="Carrinho" className="relative">
            <img src="/icons/cart-icon.svg" alt="" width={24} height={24} />
          </Link>
          <AccountMenu />
          <MobileMenu pathname={pathname} />
        </div>
      </div>
    </header>
  )
}

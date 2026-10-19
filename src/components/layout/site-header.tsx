import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ComingSoon } from './coming-soon'
import { MobileMenu } from './mobile-menu'
import { NAV_ITEMS } from './nav-items'

export function SiteHeader() {
  const pathname = useLocation({ select: (l) => l.pathname })

  return (
    <header className="mx-auto w-full max-w-page px-4 pt-6 lg:px-0">
      <div className="flex h-[45px] items-center justify-between border-b border-primary/30">
        <Link to="/" className="w-40 text-sm font-bold tracking-[0.1em]" aria-label="Kurio, página inicial">
          KURIO
        </Link>

        <nav aria-label="Principal" className="hidden h-full lg:block">
          <ul className="flex h-full gap-10">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive?.(pathname) ?? false
              return (
                <li key={item.label} className="flex h-full items-start">
                  {item.to ? (
                    <Link
                      to={item.to}
                      hash={item.hash}
                      activeOptions={{ includeHash: true }}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-full flex-col border-b-3 border-transparent text-base',
                        active && 'border-primary font-bold text-highlight',
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
          <Button asChild size="sm" className="hidden px-2.5 font-medium lg:inline-flex">
            <Link to="/login">
              <img src="/icons/logout.svg" alt="" width={18} height={17} />
              Entrar
            </Link>
          </Button>
          <MobileMenu pathname={pathname} />
        </div>
      </div>
    </header>
  )
}

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ComingSoon } from './coming-soon'
import { NAV_ITEMS } from './nav-items'

// Menu das telas menores que 1024px. O Sheet (Radix) já prende o foco e fecha com Esc.
export function MobileMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Abrir menu">
          <MenuIcon className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="gap-8 p-6">
        <div className="flex flex-col gap-1">
          <SheetTitle className="text-sm font-bold tracking-[0.1em]">KURIO</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal</SheetDescription>
        </div>
        <nav aria-label="Principal (menu)">
          <ul className="flex flex-col gap-5 text-base">
            {NAV_ITEMS.map((item) => {
              const active = item.isActive?.(pathname) ?? false
              return (
                <li key={item.label}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={cn(active && 'font-bold text-highlight')}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <ComingSoon>{item.label}</ComingSoon>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
        <Button asChild>
          <Link to="/login" onClick={close}>
            <img src="/icons/logout.svg" alt="" width={18} height={17} />
            Entrar
          </Link>
        </Button>
      </SheetContent>
    </Sheet>
  )
}

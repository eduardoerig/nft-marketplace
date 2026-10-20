import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useSession } from '@/features/auth/queries'
import { CartLink } from '@/features/cart/components/cart-link'
import { ComingSoon } from './coming-soon'

// Telas de compra no mobile são "tela cheia" no Figma (voltar + título), sem a barra inferior.
const HIDDEN_ON = ['/nfts', '/cart', '/checkout', '/orders']

const itemClass = 'flex size-11 items-center justify-center rounded-full'

export function MobileTabBar() {
  const pathname = useLocation({ select: (l) => l.pathname })
  // No mobile não há header: o rótulo do Perfil diz quem está logado (para leitor de tela).
  const user = useSession().data?.user
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null

  return (
    <nav
      aria-label="Atalhos"
      // A sombra fica no <nav> (drop-shadow segue o contorno do fundo, inclusive o recorte).
      className="fixed inset-x-0 bottom-0 z-40 h-[95px] drop-shadow-[0_-10px_30px_rgb(10_6_4/45%)] md:hidden"
    >
      {/* Fundo: laterais lisas + o trecho central em SVG com o recorte do Figma, onde o botão
          central se encaixa (150px de largura, 49px de fundo, com "ombros" suaves — curvas
          ajustadas ao perfil medido no frame Mobile / Início). */}
      <div aria-hidden="true" className="absolute inset-0 flex">
        <div className="-mr-px flex-1 rounded-tl-[40px] bg-card" />
        <svg viewBox="0 0 150 95" className="h-full w-[150px] shrink-0 fill-card">
          <path d="M0 0C15 0 24 10 33 25C42 40 55 49 75 49C95 49 108 40 117 25C126 10 135 0 150 0V95H0Z" />
        </svg>
        <div className="-ml-px flex-1 rounded-tr-[40px] bg-card" />
      </div>
      <ul className="relative mx-auto flex h-full max-w-[414px] items-center justify-between px-8">
        <li>
          <Link to="/" aria-label="Início" className={cn(itemClass, pathname === '/' && 'bg-secondary')}>
            <img src="/icons/bold-home.svg" alt="" width={20} height={20} />
          </Link>
        </li>
        <li>
          <ComingSoon className={itemClass}>
            <img src="/icons/heart.svg" alt="" width={20} height={20} />
            <span className="sr-only">Favoritos</span>
          </ComingSoon>
        </li>
        {/* Centro do botão 8px abaixo da borda da barra, dentro do recorte (como no Figma). */}
        <li className="-mt-[79px]">
          <Link
            to="/"
            hash="catalogo"
            activeOptions={{ includeHash: true }}
            aria-label="Explorar catálogo"
            className="flex size-[65px] items-center justify-center rounded-full bg-linear-to-b from-primary/40 to-primary shadow-card"
          >
            <img src="/icons/scan.svg" alt="" width={27} height={24} />
          </Link>
        </li>
        <li>
          <CartLink icon="shop" iconSize={20} className={itemClass} />
        </li>
        <li>
          <Link
            to="/account/profile"
            aria-label={user ? `Perfil de ${user.displayName}` : 'Perfil'}
            className={cn(itemClass, pathname.startsWith('/account') && 'bg-secondary')}
          >
            <img src="/icons/user.svg" alt="" width={20} height={20} />
          </Link>
        </li>
      </ul>
    </nav>
  )
}

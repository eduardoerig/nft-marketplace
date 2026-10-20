import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { useCart } from '../queries'

type Props = {
  icon: string // ícone do Figma: "cart-icon" (header) ou "shop" (barra inferior)
  iconSize: number
  className?: string
}

/**
 * Ícone do carrinho com o selo de quantidade do Figma (círculo 16px `primary` com borda 2px).
 * O número também vai no rótulo do link: "Carrinho, 3 itens".
 */
export function CartLink({ icon, iconSize, className }: Props) {
  const count = useCart().data?.itemCount ?? 0
  const label = count === 0 ? 'Carrinho' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`

  return (
    <Link to="/cart" aria-label={label} className={cn('relative', className)}>
      <img src={`/icons/${icon}.svg`} alt="" width={iconSize} height={iconSize} />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-primary px-0.5 text-[10px] font-medium text-primary-foreground"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

import { Link } from '@tanstack/react-router'
import { ComingSoon } from '@/components/layout/coming-soon'
import { useLogout } from '@/features/auth/queries'

const itemClass =
  'flex h-11 items-center gap-3 border-b-3 border-transparent px-3 text-sm text-highlight lg:h-[45px] lg:border-b-0 lg:border-l-6 lg:px-2.5 lg:text-[15px]'

// Itens do Figma fora do escopo do desafio: visíveis, mas "Em breve" (só no desktop).
// Ícones `menu-*`: cópias com a cor e o tamanho do menu no Figma (os originais servem à barra do mobile).
const COMING_SOON = [
  { label: 'Atividade', icon: 'menu-shopping', size: 18 },
  { label: 'Lista de interesse', icon: 'menu-heart', size: 16 },
  { label: 'Ofertas', icon: 'curved-activity', size: 18 },
  { label: 'Arquivos baixados', icon: 'curved-download', size: 18 },
  { label: 'Suporte', icon: 'curved-danger-triangle', size: 18 },
]

/**
 * Menu lateral "Meu perfil" (310px no desktop). Item ativo: barra de 6px `primary` à esquerda.
 * No mobile (sem frame no Figma) vira uma faixa com Dados do perfil · Carteiras · Sair, sem ícones
 * e com o item ativo sublinhado.
 */
export function AccountNav() {
  const logout = useLogout()

  return (
    <nav aria-labelledby="conta-titulo" className="bg-card py-4 lg:w-[310px] lg:shrink-0 lg:self-start">
      <h2 id="conta-titulo" className="px-2.5 pb-2 text-lg font-bold max-lg:sr-only">
        Meu perfil
      </h2>
      <ul className="flex flex-wrap justify-between gap-x-4 lg:flex-col">
        <li>
          <AccountLink to="/account/profile" icon="menu-user" size={18}>
            Dados do perfil
          </AccountLink>
        </li>
        <li>
          <AccountLink to="/account/wallets" icon="light-outline-location" size={20}>
            Carteiras
          </AccountLink>
        </li>
        {COMING_SOON.map((item) => (
          <li key={item.label} className="max-lg:hidden">
            <ComingSoon className={itemClass}>
              <img
                src={`/icons/${item.icon}.svg`}
                alt=""
                width={item.size}
                height={item.size}
                className="max-lg:hidden"
              />
              {item.label}
            </ComingSoon>
          </li>
        ))}
        <li className="lg:border-t lg:border-border">
          <button type="button" onClick={() => logout.mutate()} className={`${itemClass} w-full font-bold`}>
            <img src="/icons/menu-logout.svg" alt="" width={20} height={20} className="max-lg:hidden" />
            Sair
          </button>
        </li>
      </ul>
    </nav>
  )
}

function AccountLink({
  to,
  icon,
  size,
  children,
}: {
  to: '/account/profile' | '/account/wallets'
  icon: string
  size: number
  children: string
}) {
  return (
    <Link
      to={to}
      className={`${itemClass} whitespace-nowrap data-[status=active]:border-primary`}
      activeProps={{ 'aria-current': 'page' }}
    >
      <img src={`/icons/${icon}.svg`} alt="" width={size} height={size} className="max-lg:hidden" />
      {children}
    </Link>
  )
}

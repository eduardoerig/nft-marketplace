// Itens da navegação principal (header desktop e menu mobile).
// "Mercado" fica ativo nas telas de compra, como no Figma; os demais estão fora do escopo.
export type NavItem = {
  label: string
  to?: '/'
  hash?: string // Mercado leva direto ao catálogo
  isActive?: (pathname: string) => boolean
}

const SHOP_PATHS = ['/nfts', '/cart', '/checkout', '/orders']

export const NAV_ITEMS: NavItem[] = [
  { label: 'Início', to: '/', isActive: (p) => !SHOP_PATHS.some((s) => p.startsWith(s)) },
  { label: 'Mercado', to: '/', hash: 'catalogo', isActive: (p) => SHOP_PATHS.some((s) => p.startsWith(s)) },
  { label: 'Criadores' },
  { label: 'Aprenda' },
]

import type { NftListParams } from '@/api/types'

// Todas as chaves de cache num lugar só.
// Dados privados levam o dono na chave (`owner` = id do usuário, ou "guest:<cartId>" no carrinho
// do visitante): trocar de usuário nunca reaproveita o cache de outro.
export const queryKeys = {
  session: ['session'] as const,

  nfts: {
    all: ['nfts'] as const,
    list: (params: NftListParams) => ['nfts', 'list', params] as const,
    featured: ['nfts', 'featured'] as const,
    detail: (id: string) => ['nfts', 'detail', id] as const,
  },

  favorites: (owner: string) => ['favorites', owner] as const,
  cart: (owner: string) => ['cart', owner] as const,
  quote: (owner: string, couponCode: string | null) => ['quote', owner, couponCode] as const,
  order: (owner: string, orderId: string) => ['order', owner, orderId] as const,
  profile: (owner: string) => ['profile', owner] as const,
  wallets: (owner: string) => ['wallets', owner] as const,
}

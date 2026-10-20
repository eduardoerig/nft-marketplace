import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as cartApi from '@/api/cart'
import { getGuestCartId, setGuestCartId } from '@/api/client'
import * as quoteApi from '@/api/quote'
import type { Cart, CartItemInput } from '@/api/types'
import { queryKeys } from '@/lib/queryKeys'
import { useSession } from '@/features/auth/queries'

/**
 * Id do carrinho do visitante. Nasce na primeira leitura e fica no localStorage (vai no header
 * X-Cart-Id): assim o carrinho sobrevive ao refresh antes de qualquer login.
 */
function guestCartId() {
  const existing = getGuestCartId()
  if (existing) return existing
  const id = crypto.randomUUID()
  setGuestCartId(id)
  return id
}

/** Dono do carrinho na chave do cache: o usuário logado ou "guest:<id>". */
function useCartOwner() {
  const session = useSession()
  const userId = session.data?.user.id
  return { owner: userId ?? `guest:${guestCartId()}`, ready: !session.isPending }
}

export function useCart() {
  const { owner, ready } = useCartOwner()
  return useQuery({
    queryKey: queryKeys.cart(owner),
    queryFn: ({ signal }) => cartApi.getCart(signal),
    enabled: ready, // espera saber se há sessão: senão buscaria o carrinho errado
    staleTime: 0,
  })
}

/**
 * Cotação do carrinho atual: a fonte de subtotal, desconto, taxa e total (o app não recalcula).
 * A chave leva o cupom; ao mudar o carrinho, toda cotação é invalidada.
 */
export function useQuote(couponCode: string | undefined, enabled: boolean) {
  const { owner, ready } = useCartOwner()
  return useQuery({
    queryKey: queryKeys.quote(owner, couponCode ?? null),
    queryFn: ({ signal }) => quoteApi.createQuote({ couponCode }, signal),
    enabled: ready && enabled,
    staleTime: 0,
    placeholderData: (previous) => previous, // troca de valores sem piscar o skeleton
  })
}

/** Busca uma cotação com o cupom antes de aplicá-lo: erro de cupom volta para o campo. */
export function useCheckCoupon() {
  const { owner } = useCartOwner()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (couponCode: string) =>
      queryClient.fetchQuery({
        queryKey: queryKeys.quote(owner, couponCode),
        queryFn: () => quoteApi.createQuote({ couponCode }),
        staleTime: 0,
      }),
  })
}

/** Toda mudança no carrinho: a resposta (carrinho completo) vai para o cache e as cotações caem. */
function useCartMutation<TInput>(mutationFn: (input: TInput) => Promise<Cart>) {
  const { owner } = useCartOwner()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(owner), cart)
      return queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
  })
}

export const useAddToCart = () => useCartMutation((input: CartItemInput) => cartApi.addCartItem(input))

export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    cartApi.updateCartItem(itemId, { quantity }),
  )

export const useRemoveCartItem = () => useCartMutation((itemId: string) => cartApi.removeCartItem(itemId))

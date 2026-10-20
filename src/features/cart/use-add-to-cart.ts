import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { CartItemInput } from '@/api/types'
import { useAddToCart } from './queries'

/**
 * "Adicionar ao carrinho" com o mesmo retorno em todo lugar: aviso com atalho "Ver carrinho"
 * (ou, em "Comprar", vai direto para o carrinho) e a mensagem da API quando falta estoque.
 */
export function useAddToCartAction() {
  const addToCart = useAddToCart()
  const navigate = useNavigate()

  function add(input: CartItemInput, { goToCart = false } = {}) {
    addToCart.mutate(input, {
      onSuccess: () => {
        if (goToCart) {
          navigate({ to: '/cart' })
          return
        }
        toast.success('Adicionado ao carrinho.', {
          action: { label: 'Ver carrinho', onClick: () => navigate({ to: '/cart' }) },
        })
      },
      onError: (error) => toast.error(error.message || 'Não foi possível adicionar ao carrinho.'),
    })
  }

  return { add, isPending: addToCart.isPending }
}

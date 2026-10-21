import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { CartItemInput } from '@/api/types'
import { smallImage } from '@/lib/images'
import { useAddToCart } from './queries'

/**
 * "Adicionar ao carrinho" com o mesmo retorno em todo lugar: aviso com a miniatura do NFT e o atalho
 * "Ver carrinho" (ou, em "Comprar", vai direto para o carrinho) e a mensagem da API quando falta estoque.
 */
export function useAddToCartAction() {
  const addToCart = useAddToCart()
  const navigate = useNavigate()

  function add(input: CartItemInput, { goToCart = false } = {}) {
    addToCart.mutate(input, {
      onSuccess: (cart) => {
        if (goToCart) {
          navigate({ to: '/cart' })
          return
        }
        // A resposta é o carrinho inteiro: a linha deste NFT traz nome, edição e arte.
        const item = cart.items.find((i) => i.nftId === input.nftId && i.editionId === input.editionId)
        toast.success('Adicionado ao carrinho', {
          description: item && `${item.name} · ${item.editionName}`,
          icon: item && (
            <img
              src={smallImage(item.image)}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-lg object-cover"
            />
          ),
          action: { label: 'Ver carrinho', onClick: () => navigate({ to: '/cart' }) },
        })
      },
      onError: (error) => toast.error(error.message || 'Não foi possível adicionar ao carrinho.'),
    })
  }

  return { add, isPending: addToCart.isPending }
}

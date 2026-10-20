import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { CartItem } from '@/api/types'
import { formatEth } from '@/lib/money'
import { QuantityStepper } from '@/components/quantity-stepper'
import { lineLimit } from '../limits'
import { useRemoveCartItem, useUpdateCartItem } from '../queries'

/**
 * Uma linha do carrinho. Desktop: linha da tabela do Figma (NFT · Preço · Edições · Total · lixeira).
 * Mobile: card com a imagem à esquerda, valores e o − / + à direita.
 */
export function CartItemRow({ item }: { item: CartItem }) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const limit = lineLimit(item)
  const overLimit = item.quantity > limit // a disponibilidade caiu depois que o item entrou

  const onError = (error: Error) => toast.error(error.message || 'Não foi possível atualizar o carrinho.')
  const setQuantity = (quantity: number) => update.mutate({ itemId: item.id, quantity }, { onError })
  const removeItem = () => remove.mutate(item.id, { onError })

  return (
    <li
      aria-busy={busy}
      className="relative flex gap-2.5 overflow-hidden rounded-[10px] bg-card lg:grid lg:h-[70px] lg:grid-cols-[250px_77px_75px_87px_24px] lg:items-center lg:justify-between lg:gap-4 lg:rounded-none lg:pr-6"
    >
      <div className="flex items-center gap-4 max-lg:contents">
        <img
          src={item.image}
          alt=""
          width={70}
          height={70}
          className="size-[100px] shrink-0 object-cover lg:size-[70px] lg:rounded-md"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-2.5 lg:py-0">
          <h3 className="truncate text-base/4 font-bold">
            <Link to="/nfts/$nftId" params={{ nftId: item.nftId }} className="hover:text-highlight">
              {item.name}
            </Link>
          </h3>
          <p className="text-sm/4 text-placeholder">Edição: {item.editionName}</p>
          <p className="text-sm/4 text-placeholder max-lg:hidden">ID do token: {item.tokenId}</p>
          {/* Mobile: o valor da linha fica embaixo do nome (no desktop há colunas próprias). */}
          <p className="mt-auto text-lg/5 font-bold text-highlight lg:hidden">{formatEth(item.lineTotal)}</p>
          {overLimit && (
            <p role="alert" className="text-xs text-destructive">
              {limit === 0 ? 'Esgotou nesta edição.' : `Só restam ${limit} nesta edição.`}
            </p>
          )}
        </div>
      </div>

      <p className="text-base/4 font-bold text-muted-foreground max-lg:hidden">
        <span className="sr-only">Preço: </span>
        {formatEth(item.unitPrice)}
      </p>

      <div className="flex items-center self-center pr-3 lg:pr-0">
        <QuantityStepper
          value={item.quantity}
          max={Math.max(limit, 1)}
          onChange={setQuantity}
          label={item.name}
          size="sm"
          disabled={busy}
        />
      </div>

      <p className="text-base/4 font-bold text-highlight max-lg:hidden">
        <span className="sr-only">Total: </span>
        {formatEth(item.lineTotal)}
      </p>

      <button
        type="button"
        onClick={removeItem}
        disabled={busy}
        aria-label={`Remover ${item.name} (${item.editionName}) do carrinho`}
        className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full disabled:opacity-50 lg:static lg:size-6"
      >
        <img src="/icons/curved-delete.svg" alt="" width={22} height={22} />
      </button>
    </li>
  )
}

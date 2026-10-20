import type { QuoteItem } from '@/api/types'
import { formatEth } from '@/lib/money'
import { smallImage } from '@/lib/images'

/**
 * "Seus NFTs": as linhas de uma cotação ou de um pedido (imagem, nome, edição, quantidade e subtotal).
 * Usada no pagamento, na revisão e no recibo — sempre com os valores que vieram da API.
 */
export function OrderLines({ items }: { items: QuoteItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={`${item.nftId}:${item.editionId}`}
          className="flex min-h-[70px] items-center gap-2 rounded-lg bg-card py-1 pr-4 pl-1 md:rounded-none"
        >
          <img
            src={smallImage(item.image)}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            className="size-16 shrink-0 rounded-lg object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <p className="truncate text-base/4 font-bold">{item.name}</p>
            <p className="truncate text-sm/4 text-placeholder">
              ID do token: {item.tokenId} · {item.editionName}
            </p>
          </div>
          <p className="shrink-0 text-sm/4 text-muted-foreground">
            <span className="sr-only">Quantidade: </span>(x {item.quantity})
          </p>
          <p className="shrink-0 text-right text-lg/4 font-bold text-highlight">
            <span className="sr-only">Subtotal: </span>
            {formatEth(item.lineTotal)}
          </p>
        </li>
      ))}
    </ul>
  )
}

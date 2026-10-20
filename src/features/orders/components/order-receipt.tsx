import { Link } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import type { Order } from '@/api/types'
import { compare, formatEth } from '@/lib/money'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { PROVIDER_LABELS } from '@/features/account/wallet-values'
import { NETWORK_LABELS } from '@/features/catalog/search'
import { OrderLines } from '@/features/checkout/components/order-lines'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
/** "29 Jul, 2026", como no Figma. */
const formatDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}
const short = (hex: string) => `${hex.slice(0, 6)}…${hex.slice(-4)}`

const EXPLORER_NAMES = { ethereum: 'Etherscan', polygon: 'Polygonscan', solana: 'Solscan' } as const

const HEADINGS: Record<Order['status'], string> = {
  pending: 'Confirmando seu pedido',
  confirmed: 'Seus NFTs agora estão na sua carteira',
  rejected: 'Pagamento recusado',
}

/**
 * Conteúdo do modal do pedido (frame "Desktop / Confirmação de Pedido"). Tudo vem do snapshot do
 * pedido: mudar o preço do NFT depois não altera o recibo. Três estados: pendente, confirmado, recusado.
 */
export function OrderReceipt({ order }: { order: Order }) {
  return (
    <div className="flex flex-col">
      {/* Anuncia cada mudança de estado para o leitor de tela. */}
      <p role="status" className="sr-only">
        {order.status === 'pending'
          ? 'Pedido enviado. Aguardando a confirmação da rede.'
          : order.status === 'confirmed'
            ? 'Pagamento confirmado.'
            : 'Pagamento recusado.'}
      </p>

      <header className="flex flex-col items-center gap-4 px-6 pt-6 pb-5 text-center">
        {order.status === 'pending' ? (
          <Loader2Icon
            aria-hidden="true"
            className="size-16 animate-spin text-primary motion-reduce:animate-none"
          />
        ) : (
          <img
            src={order.status === 'confirmed' ? '/icons/thank-you.svg' : '/icons/curved-danger-triangle.svg'}
            alt=""
            width={80}
            height={80}
            className="size-20"
          />
        )}
        <DialogTitle className="text-base/4 font-bold text-muted-foreground">
          {HEADINGS[order.status]}
        </DialogTitle>
        <DialogDescription className={order.status === 'pending' ? 'max-w-sm text-sm' : 'sr-only'}>
          {order.status === 'pending'
            ? 'A rede está processando o pagamento. Leva alguns segundos — pode fechar esta janela, o pedido continua.'
            : `Pedido ${order.id}`}
        </DialogDescription>
      </header>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-y border-primary px-6 py-3 text-muted-foreground sm:flex sm:justify-between sm:px-9">
        <Meta
          label={order.transaction ? 'ID da transação' : 'Pedido'}
          value={order.transaction ? short(order.transaction.hash) : order.id}
          strong
        />
        <Meta label="Data" value={formatDate(order.createdAt)} />
        <Meta label="Total" value={formatEth(order.total)} />
        <Meta label="Carteira" value={PROVIDER_LABELS[order.wallet.provider]} strong />
      </dl>

      <section aria-labelledby="detalhes-titulo" className="flex flex-col gap-3 px-6 pt-5 pb-8 sm:px-11">
        <h3 id="detalhes-titulo" className="text-[15px]/4 font-bold">
          Detalhes da transação
        </h3>
        <div aria-hidden="true" className="flex justify-between border-b border-primary/30 pb-3 font-bold">
          <span>NFTs</span>
          <span className="flex gap-12">
            <span>Edições</span>
            <span className="font-medium">Subtotal</span>
          </span>
        </div>
        <OrderLines items={order.items} />

        <dl className="flex flex-col gap-2 border-b border-primary/30 pb-3 sm:pl-[170px]">
          {compare(order.discount, '0') > 0 && (
            <Row label="Desconto" value={`(-) ${formatEth(order.discount)}`} />
          )}
          <Row label="Taxa de rede" value={formatEth(order.networkFee)} />
          <div className="flex items-center justify-between font-bold">
            <dt>Total</dt>
            <dd className="text-lg/5 text-highlight">{formatEth(order.total)}</dd>
          </div>
        </dl>

        <StatusFooter order={order} />
      </section>
    </div>
  )
}

function StatusFooter({ order }: { order: Order }) {
  const network = NETWORK_LABELS[order.network]
  if (order.status === 'confirmed' && order.transaction) {
    return (
      <div className="flex flex-col items-center gap-5 pt-2 text-center">
        <p className="max-w-[460px] text-[13px]/[22px] text-muted-foreground">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada e
          registrada na rede.
        </p>
        <Button asChild className="h-12 px-4 text-base font-bold">
          <a href={order.transaction.explorerUrl} target="_blank" rel="noreferrer">
            Ver no {EXPLORER_NAMES[order.network]}
            <span className="sr-only"> (abre em nova aba; link simulado)</span>
          </a>
        </Button>
      </div>
    )
  }
  if (order.status === 'rejected') {
    return (
      <div className="flex flex-col items-center gap-5 pt-2 text-center">
        <p className="max-w-[460px] text-sm text-destructive">{order.failureReason}</p>
        <p className="text-[13px] text-muted-foreground">
          Nada foi cobrado. Os itens continuam no seu carrinho.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="font-bold">
            <Link to="/cart">Voltar ao carrinho</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/checkout">Tentar de novo</Link>
          </Button>
        </div>
      </div>
    )
  }
  return (
    <p className="pt-2 text-center text-[13px] text-muted-foreground">
      Você pode acompanhar por aqui: esta tela se atualiza sozinha.
    </p>
  )
}

function Meta({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col sm:border-l sm:border-primary sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <dt className={strong ? 'text-sm/4 font-bold' : 'text-sm/4'}>{label}</dt>
      <dd className="truncate text-[15px]/5">{value}</dd>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[15px]">{label}</dt>
      <dd className="text-lg/5">{value}</dd>
    </div>
  )
}

import type { Eth } from '@/api/types'
import { formatEth } from '@/lib/money'

type Props = {
  subtotal: Eth
  discount: Eth
  networkFee: Eth
  total: Eth
  couponCode?: string | null
}

/** Subtotal, desconto, taxa de rede e total — os valores da cotação ou do pedido, sem recalcular. */
export function PriceSummary({ subtotal, discount, networkFee, total, couponCode }: Props) {
  return (
    <dl className="flex flex-col gap-3">
      <Row label="Subtotal" value={formatEth(subtotal)} />
      <Row
        label={couponCode ? `Desconto do lançamento (${couponCode})` : 'Desconto do lançamento'}
        value={`(-) ${formatEth(discount)}`}
      />
      <div className="flex flex-col gap-1">
        <Row label="Taxa de rede" value={formatEth(networkFee)} />
        <p className="text-right text-xs text-highlight">Taxa estimada</p>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-primary/30 pt-4 font-bold">
        <dt className="text-base">Total</dt>
        <dd className="text-lg/4 text-highlight">{formatEth(total)}</dd>
      </div>
    </dl>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[15px]">{label}</dt>
      <dd className="text-right text-[15px] md:text-lg/4">{value}</dd>
    </div>
  )
}

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
      {/* "Taxa estimada" fica dentro do <dd>: um <dl> só pode ter pares <dt>/<dd>. */}
      <div className="flex items-start justify-between gap-4">
        <dt className="text-[15px]">Taxa de rede</dt>
        <dd className="flex flex-col items-end gap-1 text-[15px] md:text-lg/4">
          <span>{formatEth(networkFee)}</span>
          <span className="text-xs text-highlight">Taxa estimada</span>
        </dd>
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

import { Link } from '@tanstack/react-router'
import type { Quote } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { describeQuoteChanges } from '../queries'
import { OrderLines } from './order-lines'
import { PriceSummary } from './price-summary'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** A cotação que a pessoa está revisando (fica parada enquanto o diálogo está aberto). */
  reviewed: Quote
  /** A cotação mais recente da API (muda com o tempo real ou depois de um 409 QUOTE_STALE). */
  latest: Quote | undefined
  onConfirm: () => void
  onAcceptChanges: () => void
  isSubmitting: boolean
  error: string | null
  /** O pedido não pode seguir (ex.: esgotou): só resta voltar ao carrinho. */
  blocked: boolean
}

/**
 * Revisão antes de enviar: itens, cupom, taxas e total da cotação. Se os valores mudarem enquanto a
 * pessoa revisa (ou o servidor responder QUOTE_STALE), o diálogo mostra o que mudou e só deixa
 * seguir depois de uma nova confirmação.
 */
export function ReviewDialog(props: Props) {
  const { open, onOpenChange, reviewed, latest, onConfirm, onAcceptChanges, isSubmitting, error, blocked } =
    props
  const changed = latest && latest.quoteId !== reviewed.quoteId ? describeQuoteChanges(reviewed, latest) : []
  const shown = changed.length > 0 && latest ? latest : reviewed

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto sm:max-w-[560px]">
        <DialogTitle className="text-xl font-bold">Revise seu pedido</DialogTitle>
        <DialogDescription>
          Confira os itens e os valores. O pagamento usa exatamente esta cotação.
        </DialogDescription>

        {changed.length > 0 && (
          <div role="alert" className="flex flex-col gap-2 rounded-[10px] border border-highlight/60 p-4">
            <p className="font-bold">Os valores mudaram desde que você abriu a revisão:</p>
            <ul className="list-disc pl-5 text-sm">
              {changed.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>
        )}

        <OrderLines items={shown.items} />
        <PriceSummary {...shown} couponCode={shown.coupon?.code} />

        {/* Com a lista de mudanças na tela, o aviso genérico (ex.: QUOTE_STALE) já não é preciso. */}
        {error && changed.length === 0 && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="gap-3 sm:justify-between">
          {blocked ? (
            <Button asChild variant="outline">
              <Link to="/cart">Voltar ao carrinho</Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Voltar e editar
            </Button>
          )}
          {!blocked &&
            (changed.length > 0 ? (
              <Button onClick={onAcceptChanges} className="font-bold">
                Aceitar os novos valores
              </Button>
            ) : (
              <Button onClick={onConfirm} disabled={isSubmitting} className="font-bold">
                {isSubmitting ? 'Enviando pedido…' : 'Confirmar e pagar'}
              </Button>
            ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

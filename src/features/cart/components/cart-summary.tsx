import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import type { ApiError } from '@/api/client'
import type { Quote } from '@/api/types'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCheckCoupon } from '../queries'

type Props = {
  quote: Quote | undefined
  error: ApiError | null
  isLoading: boolean
  isRefreshing: boolean
  onRetry: () => void
  couponCode: string | undefined
  onCouponChange: (code: string | undefined) => void
  canCheckout: boolean
}

/**
 * "Resumo da carteira": cupom, subtotal, desconto, taxa e total — todos vindos da cotação da API
 * (o app não recalcula nada). Desktop: coluna à direita. Mobile: bloco no fim da tela, como no Figma.
 */
export function CartSummary(props: Props) {
  const { quote, error, isLoading, isRefreshing, onRetry, canCheckout, couponCode } = props

  return (
    <section
      aria-labelledby="resumo-titulo"
      className="-mx-4 flex flex-col gap-6 rounded-t-[30px] bg-card px-4 pt-6 pb-8 lg:mx-0 lg:w-[332px] lg:shrink-0 lg:rounded-none lg:bg-transparent lg:p-0"
    >
      <h2 id="resumo-titulo" className="border-b border-primary/30 pb-3 text-lg/4 font-bold max-lg:sr-only">
        Resumo da carteira
      </h2>

      <CouponForm {...props} />

      {isLoading ? (
        <div role="status" aria-label="Calculando valores" className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : error && error.code !== 'VALIDATION' ? (
        <div role="alert" className="flex flex-col items-start gap-3 text-sm">
          <p className="text-destructive">
            {error.reason === 'OUT_OF_STOCK'
              ? `${error.message} Ajuste a quantidade para continuar.`
              : 'Não foi possível calcular os valores.'}
          </p>
          {error.reason !== 'OUT_OF_STOCK' && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar novamente
            </Button>
          )}
        </div>
      ) : quote ? (
        <dl aria-busy={isRefreshing} className={cn('flex flex-col gap-3', isRefreshing && 'opacity-60')}>
          <Row label="Subtotal" value={formatEth(quote.subtotal)} />
          <Row label="Desconto do lançamento" value={`(-) ${formatEth(quote.discount)}`} small />
          <div className="flex flex-col gap-1">
            <Row label="Taxa de rede" value={formatEth(quote.networkFee)} />
            <p className="text-right text-xs text-highlight">Taxa estimada</p>
          </div>
          <div className="mt-3 flex items-center justify-between font-bold">
            <dt className="text-base">Total</dt>
            <dd className="text-lg text-highlight">{formatEth(quote.total)}</dd>
          </div>
        </dl>
      ) : null}

      <div className="flex flex-col items-center gap-4">
        {canCheckout && quote && !error ? (
          <Button
            asChild
            className="h-[60px] w-full rounded-[40px] text-base font-bold lg:h-10 lg:rounded-md"
          >
            <Link to="/checkout" search={{ cupom: couponCode }}>
              Conectar e finalizar
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            className="h-[60px] w-full rounded-[40px] text-base font-bold lg:h-10 lg:rounded-md"
          >
            Conectar e finalizar
          </Button>
        )}
        <Link to="/" hash="catalogo" className="text-[15px] text-highlight hover:underline max-lg:hidden">
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[15px]">{label}</dt>
      <dd className={small ? 'text-[15px]' : 'text-lg/4'}>{value}</dd>
    </div>
  )
}

/** "Código promocional": confere o cupom na API antes de aplicar; erro aparece no campo. */
function CouponForm({ couponCode, onCouponChange }: Props) {
  const [code, setCode] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const check = useCheckCoupon()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const value = code.trim().toUpperCase()
    if (!value) return setFieldError('Digite um código.')
    setFieldError(null)
    check.mutate(value, {
      onSuccess: () => {
        onCouponChange(value)
        setCode('')
      },
      onError: (e) => setFieldError(e.fields?.couponCode ?? e.message),
    })
  }

  if (couponCode) {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <p>
          Cupom <strong className="text-highlight">{couponCode}</strong> aplicado
        </p>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-highlight"
          onClick={() => onCouponChange(undefined)}
        >
          Remover cupom
        </Button>
      </div>
    )
  }

  const message = fieldError
  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="cupom" className="text-sm font-bold max-lg:sr-only">
        Código promocional
      </label>
      <div className="flex h-[50px] overflow-hidden rounded-[30px] border border-input lg:h-10 lg:rounded-sm lg:border-primary">
        <input
          id="cupom"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={Boolean(message)}
          aria-describedby={message ? 'cupom-erro' : undefined}
          className="min-w-0 flex-1 bg-transparent px-4 text-sm uppercase placeholder:text-placeholder placeholder:normal-case focus-visible:outline-none lg:px-2 lg:text-xs"
        />
        <button
          type="submit"
          disabled={check.isPending}
          className="rounded-[30px] bg-linear-to-r from-primary to-primary/80 px-5 text-[15px] font-bold text-primary-foreground disabled:opacity-60 lg:rounded-none lg:bg-primary lg:bg-none lg:px-7"
        >
          {check.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {message && (
        <p id="cupom-erro" role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </form>
  )
}

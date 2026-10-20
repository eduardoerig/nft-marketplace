import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Profile, Quote, Wallet, WalletProvider } from '@/api/types'
import { NETWORKS } from '@/api/types'
import { applyApiErrors } from '@/lib/form-errors'
import { clearIdempotencyKey } from '@/lib/idempotency'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABELS } from '@/features/catalog/search'
import {
  CHECKOUT_FIELDS,
  checkoutSchema,
  clearDraft,
  initialValues,
  saveDraft,
  type CheckoutValues,
} from '../form'
import { useConnectWallet, useCreateOrder } from '../queries'
import { OrderLines } from './order-lines'
import { PriceSummary } from './price-summary'
import { ReviewDialog } from './review-dialog'
import { WalletConnect, type ConnectionStatus } from './wallet-connect'
import { WalletPicker } from './wallet-picker'

type Props = {
  profile: Profile
  wallets: Wallet[]
  quote: Quote | undefined
  quoteLoading: boolean
  couponCode: string | undefined
}

type Connection = { status: ConnectionStatus; walletId?: string; provider?: WalletProvider; address?: string }

/**
 * Pagamento: dados do colecionador, carteira, conexão simulada e revisão antes de enviar o pedido.
 * Tudo que é valor vem da cotação; o formulário fica salvo como rascunho (sessão expirada não perde nada).
 */
export function CheckoutForm({ profile, wallets, quote, quoteLoading, couponCode }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const form = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: initialValues(profile, wallets),
  })
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = form

  // Rascunho: cada mudança vai para o sessionStorage.
  const values = useWatch({ control })
  useEffect(() => saveDraft(values as Partial<CheckoutValues>), [values])

  const walletId = values.walletId ?? ''
  const wallet = wallets.find((w) => w.id === walletId)
  const [provider, setProvider] = useState<WalletProvider>(wallet?.provider ?? 'metamask')

  // Conexão simulada. Vale só para a carteira e o app em que foi feita: trocar qualquer um volta a "conectar".
  const connectWallet = useConnectWallet()
  const [connection, setConnection] = useState<Connection>({ status: 'idle' })
  const sameTarget = connection.walletId === walletId && connection.provider === provider
  const status: ConnectionStatus = connectWallet.isPending
    ? 'connecting'
    : sameTarget
      ? connection.status
      : 'idle'
  const connectButton = useRef<HTMLButtonElement>(null)

  function connect() {
    if (!walletId) return setError('walletId', { message: 'Escolha uma carteira.' })
    connectWallet.mutate(
      { walletId, provider },
      {
        onSuccess: (result) =>
          setConnection({ status: 'connected', walletId, provider, address: result.address }),
        onError: (error) => {
          setConnection({
            status: error.reason === 'WALLET_REJECTED' ? 'rejected' : 'idle',
            walletId,
            provider,
          })
          if (error.reason !== 'WALLET_REJECTED') toast.error(error.message || 'Não foi possível conectar.')
        },
      },
    )
  }

  // Revisão e envio.
  const createOrder = useCreateOrder()
  const [reviewed, setReviewed] = useState<Quote | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)

  // Formulário válido → abre a revisão (sem carteira conectada, leva o foco ao botão de conectar).
  function openReview() {
    if (status !== 'connected') {
      connectButton.current?.focus()
      toast.error('Conecte a carteira para confirmar a compra.')
      return
    }
    if (!quote) return
    setOrderError(null)
    setBlocked(false)
    setReviewed(quote)
  }

  function confirm() {
    if (!reviewed || createOrder.isPending) return
    const values = checkoutSchema.parse(form.getValues())
    createOrder.mutate(
      {
        quoteId: reviewed.quoteId,
        couponCode: reviewed.coupon?.code,
        walletId: values.walletId,
        network: values.network,
        buyer: {
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          ...(values.note && { note: values.note }),
        },
      },
      {
        onSuccess: (order) => {
          clearDraft()
          clearIdempotencyKey()
          void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
        },
        onError: (error) => {
          if (error.reason === 'QUOTE_STALE') {
            // Busca a cotação nova; quando ela chegar, a revisão mostra o que mudou.
            setOrderError(error.message)
            void queryClient.invalidateQueries({ queryKey: ['quote'] })
            return
          }
          if (error.reason === 'OUT_OF_STOCK') {
            setBlocked(true)
            setOrderError(`${error.message} Ajuste o carrinho para continuar.`)
            void queryClient.invalidateQueries({ queryKey: ['cart'] })
            return
          }
          if (error.reason === 'WALLET_DISCONNECTED') {
            setReviewed(null)
            setConnection({ status: 'disconnected', walletId, provider })
            connectButton.current?.focus()
            return
          }
          if (error.code === 'VALIDATION' && error.fields) {
            setReviewed(null)
            applyApiErrors(error, setError, CHECKOUT_FIELDS)
            return
          }
          setOrderError(error.message || 'Não foi possível enviar o pedido. Tente de novo.')
        },
      },
    )
  }

  return (
    <form
      noValidate
      onSubmit={(event: FormEvent) => void handleSubmit(openReview)(event)}
      className="flex flex-col gap-10 lg:flex-row lg:justify-between lg:gap-8"
    >
      <section aria-labelledby="comprador-titulo" className="flex flex-col gap-6 lg:w-[763px]">
        <h2 id="comprador-titulo" className="text-[17px]/4 font-bold">
          Perfil do colecionador
        </h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <FormField id="checkout-nome" label="Nome de exibição" required error={errors.displayName?.message}>
            {(a11y) => <Input {...a11y} {...register('displayName')} autoComplete="name" />}
          </FormField>
          <FormField id="checkout-usuario" label="Nome de usuário" required error={errors.username?.message}>
            {(a11y) => <Input {...a11y} {...register('username')} autoComplete="username" />}
          </FormField>
          <FormField id="checkout-email" label="E-mail" required error={errors.email?.message}>
            {(a11y) => <Input {...a11y} {...register('email')} type="email" autoComplete="email" />}
          </FormField>
          <FormField id="checkout-rede" label="Rede" required error={errors.network?.message}>
            {(a11y) => (
              <NativeSelect {...a11y} {...register('network')} className="w-full">
                <NativeSelectOption value="">Selecione uma rede</NativeSelectOption>
                {NETWORKS.map((network) => (
                  <NativeSelectOption key={network} value={network}>
                    {NETWORK_LABELS[network]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>

        <WalletPicker
          wallets={wallets}
          error={errors.walletId?.message}
          field={register('walletId', {
            // Escolher a carteira sugere a rede e o app dela (a pessoa pode trocar depois).
            onChange: (event: { target: { value: string } }) => {
              const chosen = wallets.find((w) => w.id === event.target.value)
              if (!chosen) return
              setValue('network', chosen.network, { shouldValidate: true })
              setProvider(chosen.provider)
            },
          })}
        />

        <FormField
          id="checkout-obs"
          label="Observação do colecionador (opcional)"
          error={errors.note?.message}
        >
          {(a11y) => (
            <textarea
              {...a11y}
              {...register('note')}
              rows={6}
              className="w-full rounded-sm border border-input bg-transparent p-3 text-sm placeholder:text-placeholder focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:w-[350px]"
            />
          )}
        </FormField>
      </section>

      <section aria-labelledby="itens-titulo" className="flex flex-col gap-6 lg:w-[405px] lg:shrink-0">
        <h2 id="itens-titulo" className="text-[17px]/4 font-bold">
          Seus NFTs
        </h2>
        {quote ? (
          <>
            <div className="flex justify-between border-b border-primary/30 pb-3 text-base/4 font-bold max-md:hidden">
              <span>NFTs</span>
              <span className="font-medium">Subtotal</span>
            </div>
            <OrderLines items={quote.items} />
            <p className="text-center text-sm">
              {couponCode ? (
                <>
                  Cupom <strong className="text-highlight">{couponCode}</strong> aplicado
                </>
              ) : (
                <>
                  Tem um código promocional?{' '}
                  <Link to="/cart" className="text-highlight underline underline-offset-2">
                    Aplique no carrinho
                  </Link>
                </>
              )}
            </p>
            <PriceSummary {...quote} couponCode={quote.coupon?.code} />
          </>
        ) : quoteLoading ? (
          <div role="status" aria-label="Calculando valores" className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[70px] w-full" />
            ))}
          </div>
        ) : null}

        <WalletConnect
          provider={provider}
          onProviderChange={setProvider}
          status={status}
          address={connection.address}
          onConnect={connect}
          onDisconnect={() => setConnection({ ...connection, status: 'disconnected' })}
          connectButtonRef={connectButton}
        />

        <Button
          type="submit"
          disabled={!quote}
          className="h-[60px] w-full rounded-[40px] text-base font-bold md:h-[45px] md:rounded-md"
        >
          Confirmar compra
        </Button>
      </section>

      {reviewed && (
        <ReviewDialog
          open
          onOpenChange={(open) => !open && setReviewed(null)}
          reviewed={reviewed}
          latest={quote}
          onConfirm={confirm}
          onAcceptChanges={() => {
            if (quote) setReviewed(quote)
            setOrderError(null)
          }}
          isSubmitting={createOrder.isPending}
          error={orderError}
          blocked={blocked}
        />
      )}
    </form>
  )
}

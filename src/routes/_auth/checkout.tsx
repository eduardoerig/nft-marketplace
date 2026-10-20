import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { MobilePageHeader } from '@/components/layout/mobile-page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProfile, useWallets } from '@/features/account/queries'
import { useCart, useQuote } from '@/features/cart/queries'
import { CheckoutForm } from '@/features/checkout/components/checkout-form'

// O cupom vem do carrinho (/cart?cupom=…) e entra na mesma cotação aqui.
const checkoutSearchSchema = z.object({
  cupom: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_auth/checkout')({
  validateSearch: checkoutSearchSchema,
  head: () => ({ meta: [{ title: 'Pagamento — Kurio' }] }),
  component: CheckoutPage,
})

function CheckoutPage() {
  const { cupom } = Route.useSearch()
  const profile = useProfile()
  const wallets = useWallets()
  const cart = useCart()
  const hasItems = (cart.data?.items.length ?? 0) > 0
  const quote = useQuote(cupom, hasItems)

  const loading = profile.isPending || wallets.isPending || cart.isPending
  const failed = profile.error ?? wallets.error ?? cart.error

  return (
    <div className="flex flex-col gap-6 pt-6 pb-12 md:pt-8">
      <MobilePageHeader title="Pagamento com carteira" />
      <h1 className="sr-only">Pagamento com carteira</h1>
      <nav aria-label="Trilha" className="text-[15px]/4 font-bold max-md:hidden">
        <Link to="/" className="hover:text-highlight">
          Início
        </Link>
        {' / '}
        <Link to="/" hash="catalogo" className="hover:text-highlight">
          Mercado
        </Link>
        {' / '}
        <span aria-current="page">Pagamento</span>
      </nav>

      {loading ? (
        <CheckoutSkeleton />
      ) : failed ? (
        <div role="alert" className="flex flex-col items-start gap-4 py-12">
          <p className="text-lg font-bold">Não foi possível carregar o pagamento.</p>
          <Button
            onClick={() => {
              void profile.refetch()
              void wallets.refetch()
              void cart.refetch()
            }}
          >
            Tentar novamente
          </Button>
        </div>
      ) : !hasItems ? (
        <section className="flex flex-col items-center gap-6 py-20 text-center">
          <p className="text-xl font-bold">Seu carrinho está vazio</p>
          <Button asChild className="uppercase">
            <Link to="/" hash="catalogo">
              Explorar o catálogo
            </Link>
          </Button>
        </section>
      ) : quote.error && quote.error.code !== 'VALIDATION' && quote.error.reason !== 'OUT_OF_STOCK' ? (
        <div role="alert" className="flex flex-col items-start gap-4 py-12">
          <p className="text-lg font-bold">Não foi possível calcular os valores.</p>
          <Button onClick={() => quote.refetch()}>Tentar novamente</Button>
        </div>
      ) : quote.error ? (
        <div role="alert" className="flex flex-col items-start gap-4 py-12">
          <p className="text-lg font-bold">{quote.error.message}</p>
          <p className="text-sm text-muted-foreground">Ajuste o carrinho para continuar.</p>
          <Button asChild>
            <Link to="/cart" search={{ cupom }}>
              Voltar ao carrinho
            </Link>
          </Button>
        </div>
      ) : (
        <CheckoutForm
          profile={profile.data!}
          wallets={wallets.data!}
          quote={quote.data}
          quoteLoading={quote.isPending}
          couponCode={cupom}
        />
      )}
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div role="status" aria-label="Carregando pagamento" className="flex flex-col gap-8 lg:flex-row">
      <div className="grid flex-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[69px] w-full" />
        ))}
      </div>
      <div className="flex flex-col gap-3 lg:w-[405px]">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[70px] w-full" />
        ))}
      </div>
    </div>
  )
}

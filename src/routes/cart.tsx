import { useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { errorHint } from '@/lib/error-hint'
import { MobilePageHeader } from '@/components/layout/mobile-page-header'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CartItemRow } from '@/features/cart/components/cart-item-row'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { lineLimit } from '@/features/cart/limits'
import { useCart, useQuote } from '@/features/cart/queries'
import { useCartChanges } from '@/features/cart/use-cart-changes'
import { NftShelf } from '@/features/catalog/components/nft-shelf'

// O cupom aplicado fica na URL (?cupom=DESCONTO10): sobrevive ao refresh e o pagamento o recebe.
const cartSearchSchema = z.object({
  cupom: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/cart')({
  validateSearch: cartSearchSchema,
  head: () => ({ meta: [{ title: 'Carrinho — Kurio' }] }),
  component: CartPage,
})

function CartPage() {
  const { cupom } = Route.useSearch()
  const navigate = Route.useNavigate()
  const cart = useCart()
  const items = cart.data?.items ?? []
  const quote = useQuote(cupom, items.length > 0)

  const setCoupon = (code: string | undefined) =>
    navigate({ search: (prev) => ({ ...prev, cupom: code }), replace: true, resetScroll: false })

  // Cupom da URL que não vale mais (expirou, foi digitado à mão): sai da URL com aviso.
  const couponReason = quote.error?.reason
  useEffect(() => {
    if (couponReason === 'COUPON_INVALID' || couponReason === 'COUPON_EXPIRED') {
      toast.error(
        couponReason === 'COUPON_EXPIRED' ? `O cupom ${cupom} expirou.` : `O cupom ${cupom} não existe.`,
      )
      navigate({ search: (prev) => ({ ...prev, cupom: undefined }), replace: true, resetScroll: false })
    }
  }, [couponReason, cupom, navigate])

  const canCheckout = items.length > 0 && items.every((item) => item.quantity <= lineLimit(item))
  const changes = useCartChanges(cart.data?.items)

  return (
    <div className="flex flex-col gap-12 pt-6 md:gap-24 md:pt-8">
      <div className="flex flex-col gap-3">
        <MobilePageHeader title="Carrinho de NFTs" />
        <h1 className="sr-only">Carrinho de NFTs</h1>
        <nav aria-label="Trilha" className="text-[15px]/4 font-bold max-md:hidden">
          <Link to="/" className="hover:text-highlight">
            Início
          </Link>
          {' / '}
          <Link to="/" hash="catalogo" className="hover:text-highlight">
            Mercado
          </Link>
          {' / '}
          <span aria-current="page">Carrinho</span>
        </nav>

        {/* Avisos de mudança de preço/disponibilidade (tempo real). A lista existe mesmo vazia, para o
            leitor de tela anunciar o que entrar nela; vazia ela fica sr-only (display:none não anunciaria). */}
        <ul
          role="status"
          aria-live="polite"
          aria-label="Mudanças no carrinho"
          className="flex flex-col gap-2 empty:sr-only"
        >
          {changes.notices.map((notice) => (
            <li
              key={notice.id}
              className="flex items-center justify-between gap-4 rounded-[10px] border border-highlight/60 bg-card px-4 py-3 text-sm/5"
            >
              <span>{notice.message}</span>
              <button
                type="button"
                onClick={() => changes.dismiss(notice.id)}
                aria-label="Dispensar aviso"
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>

        {cart.isPending ? (
          <CartSkeleton />
        ) : cart.error ? (
          <div role="alert" className="flex flex-col items-start gap-4 py-12">
            <p className="text-lg font-bold">Não foi possível carregar o carrinho.</p>
            <p className="text-sm text-muted-foreground">{errorHint(cart.error)}</p>
            <Button onClick={() => cart.refetch()}>Tentar novamente</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-12">
            <section aria-labelledby="itens-titulo" className="flex flex-col gap-3 lg:w-[782px]">
              <h2 id="itens-titulo" className="sr-only">
                Itens ({cart.data?.itemCount})
              </h2>
              {/* Cabeçalho da tabela do Figma (só desktop; cada linha já diz o que é cada valor). */}
              <div
                aria-hidden="true"
                className="grid grid-cols-[250px_77px_75px_87px_24px] justify-between gap-4 border-b border-primary/30 pr-6 pb-3 text-base/4 font-bold max-lg:hidden"
              >
                <span>NFTs</span>
                <span>Preço</span>
                <span>Edições</span>
                <span>Total</span>
                <span />
              </div>
              <ul className="flex flex-col gap-3 md:gap-4 lg:gap-3">
                {items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
            <CartSummary
              quote={quote.data}
              error={quote.error}
              isLoading={quote.isPending}
              isRefreshing={quote.isFetching && !quote.isPending}
              onRetry={() => quote.refetch()}
              couponCode={cupom}
              onCouponChange={setCoupon}
              canCheckout={canCheckout}
            />
          </div>
        )}
      </div>

      <div className="max-md:hidden">
        <NftShelf id="tambem-viram" title="Colecionadores também viram" params={{ sort: 'popular' }} />
      </div>
    </div>
  )
}

function EmptyCart() {
  return (
    <section className="flex flex-col items-center gap-6 py-20 text-center">
      <p className="text-xl font-bold">Seu carrinho está vazio</p>
      <p className="max-w-md text-sm/6 text-muted-foreground">
        Explore o catálogo e adicione NFTs pelo botão de carrinho ou por "Comprar" no detalhe.
      </p>
      <Button asChild className="uppercase">
        <Link to="/" hash="catalogo">
          Explorar o catálogo
        </Link>
      </Button>
    </section>
  )
}

function CartSkeleton() {
  return (
    <div role="status" aria-label="Carregando carrinho" className="flex flex-col gap-3 lg:w-[782px]">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[100px] w-full rounded-[10px] lg:h-[70px] lg:rounded-none" />
      ))}
    </div>
  )
}

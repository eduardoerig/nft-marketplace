import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { errorHint } from '@/lib/error-hint'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { OrderReceipt } from '@/features/orders/components/order-receipt'
import { useOrder } from '@/features/orders/queries'

export const Route = createFileRoute('/_auth/orders/$orderId')({
  head: () => ({ meta: [{ title: 'Seu pedido — Kurio' }] }),
  component: OrderPage,
})

/**
 * O pedido abre como o modal do Figma ("Confirmação de Pedido") com o overlay leve. Fechar (X, Esc ou
 * clique fora) volta ao início — o pedido continua sendo processado e esta URL pode ser reaberta.
 */
function OrderPage() {
  const { orderId } = Route.useParams()
  const navigate = useNavigate()
  const order = useOrder(orderId)

  return (
    <>
      <h1 className="sr-only">Seu pedido</h1>
      <Dialog open onOpenChange={(open) => !open && navigate({ to: '/' })}>
        <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-[578px]">
          {order.data ? (
            <OrderReceipt order={order.data} />
          ) : order.error ? (
            <div role="alert" className="flex flex-col items-center gap-4 p-10 text-center">
              <DialogTitle className="text-lg font-bold">
                {order.error.code === 'NOT_FOUND' || order.error.code === 'FORBIDDEN'
                  ? 'Pedido não encontrado'
                  : 'Não foi possível carregar o pedido'}
              </DialogTitle>
              <DialogDescription>
                {order.error.code === 'NOT_FOUND' || order.error.code === 'FORBIDDEN'
                  ? order.error.message
                  : errorHint(order.error)}
              </DialogDescription>
              {order.error.code === 'NOT_FOUND' || order.error.code === 'FORBIDDEN' ? (
                <Button asChild>
                  <Link to="/">Voltar ao início</Link>
                </Button>
              ) : (
                <Button onClick={() => order.refetch()}>Tentar novamente</Button>
              )}
            </div>
          ) : (
            <div role="status" aria-label="Carregando pedido" className="flex flex-col gap-4 p-10">
              <DialogTitle className="sr-only">Carregando pedido</DialogTitle>
              <Skeleton className="mx-auto size-20 rounded-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-[70px] w-full" />
              <Skeleton className="h-[70px] w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

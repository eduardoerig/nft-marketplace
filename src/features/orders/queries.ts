import { useQuery } from '@tanstack/react-query'
import * as ordersApi from '@/api/orders'
import { useSession } from '@/features/auth/queries'
import { queryKeys } from '@/lib/queryKeys'

/**
 * O pedido vem do REST e é atualizado pelo evento order.updated (src/realtime/use-realtime.ts).
 * Enquanto está pendente, uma nova consulta a cada 10 s é só a rede de segurança: se o socket estiver
 * fora, o estado final chega mesmo assim (a reconexão também busca de novo).
 */
export function useOrder(orderId: string) {
  const userId = useSession().data?.user.id ?? ''
  return useQuery({
    queryKey: queryKeys.order(userId, orderId),
    queryFn: ({ signal }) => ordersApi.getOrder(orderId, signal),
    enabled: Boolean(userId),
    staleTime: 0,
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 10_000 : false),
  })
}

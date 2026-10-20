import { useEffect, useRef, useState } from 'react'
import type { CartItem } from '@/api/types'
import { formatEth } from '@/lib/money'
import { lineLimit } from './limits'

export type CartNotice = { id: string; message: string }

/**
 * Compara o carrinho com a versão anterior e descreve o que mudou por fora (preço ou disponibilidade
 * vindos do tempo real): "O preço de X mudou de A para B". Mudanças feitas pela própria pessoa
 * (quantidade, remover) não geram aviso.
 */
export function useCartChanges(items: CartItem[] | undefined) {
  const previous = useRef<Map<string, CartItem> | null>(null)
  const [notices, setNotices] = useState<CartNotice[]>([])

  useEffect(() => {
    if (!items) return
    const before = previous.current
    previous.current = new Map(items.map((item) => [item.id, item]))
    if (!before) return

    const found: CartNotice[] = []
    for (const item of items) {
      const old = before.get(item.id)
      if (!old) continue
      const label = `${item.name} (${item.editionName})`
      if (old.unitPrice !== item.unitPrice) {
        found.push({
          id: `${item.id}:price:${item.unitPrice}`,
          message: `O preço de ${label} mudou de ${formatEth(old.unitPrice)} para ${formatEth(item.unitPrice)}.`,
        })
      }
      if (lineLimit(old) !== lineLimit(item) && item.quantity > lineLimit(item)) {
        found.push({
          id: `${item.id}:limit:${lineLimit(item)}`,
          message:
            lineLimit(item) === 0
              ? `${label} esgotou.`
              : `A disponibilidade de ${label} caiu: só restam ${lineLimit(item)}.`,
        })
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reage a dado novo da rede
    if (found.length > 0) setNotices((current) => [...current, ...found].slice(-3))
  }, [items])

  const dismiss = (id: string) => setNotices((current) => current.filter((n) => n.id !== id))
  return { notices, dismiss }
}

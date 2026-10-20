import { useState } from 'react'
import type { CartItem } from '@/api/types'
import { formatEth } from '@/lib/money'
import { lineLimit } from './limits'

export type CartNotice = { id: string; message: string }

/**
 * Compara o carrinho com a versão anterior e descreve o que mudou por fora (preço ou disponibilidade
 * vindos do tempo real): "O preço de X mudou de A para B". Mudanças feitas pela própria pessoa
 * (quantidade, remover) não geram aviso.
 *
 * A comparação acontece durante a renderização, guardando os itens anteriores em estado — o padrão
 * "armazenar informação de renders anteriores" da doc do React. Num efeito, o aviso só apareceria
 * num segundo render.
 */
export function useCartChanges(items: CartItem[] | undefined) {
  const [previous, setPrevious] = useState(items)
  const [notices, setNotices] = useState<CartNotice[]>([])

  if (items !== previous) {
    setPrevious(items)
    const found = previous && items ? describeChanges(previous, items) : []
    if (found.length > 0) setNotices((current) => [...current, ...found].slice(-3))
  }

  const dismiss = (id: string) => setNotices((current) => current.filter((n) => n.id !== id))
  return { notices, dismiss }
}

function describeChanges(before: CartItem[], after: CartItem[]): CartNotice[] {
  const oldById = new Map(before.map((item) => [item.id, item]))
  const found: CartNotice[] = []
  for (const item of after) {
    const old = oldById.get(item.id)
    if (!old) continue
    const label = `${item.name} (${item.editionName})`
    if (old.unitPrice !== item.unitPrice) {
      found.push({
        id: `${item.id}:price:${item.unitPrice}`,
        message: `O preço de ${label} mudou de ${formatEth(old.unitPrice)} para ${formatEth(item.unitPrice)}.`,
      })
    }
    const limit = lineLimit(item)
    if (lineLimit(old) !== limit && item.quantity > limit) {
      found.push({
        id: `${item.id}:limit:${limit}`,
        message:
          limit === 0 ? `${label} esgotou.` : `A disponibilidade de ${label} caiu: só restam ${limit}.`,
      })
    }
  }
  return found
}

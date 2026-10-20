// Atalhos de compra para os testes de pagamento e pedido. A montagem do carrinho usa a API (da
// página, passando pelo MSW) para não repetir em todo teste o caminho que cart.spec.ts já cobre.
import type { Page } from '@playwright/test'
import { login } from './auth-helpers'
import { expect } from './fixtures'

type Line = { nftId: string; editionId: string; quantity: number }

export const EMERALD_APE: Line = { nftId: '1', editionId: 'ed-1-50', quantity: 2 } // 1.19 × 2
export const GOLDEN_BEAT: Line = { nftId: '7', editionId: 'ed-1-50', quantity: 1 } // 0.99

/** Põe itens no carrinho de quem está logado. */
export async function addToCart(page: Page, lines: Line[]) {
  const statuses = await page.evaluate(async (items) => {
    const headers = {
      'content-type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('session-token')}`,
    }
    const result: number[] = []
    for (const item of items) {
      const res = await fetch('/api/cart/items', { method: 'POST', headers, body: JSON.stringify(item) })
      result.push(res.status)
    }
    return result
  }, lines)
  expect(statuses.every((s) => s === 200)).toBe(true)
}

/** Login + carrinho + tela de pagamento carregada. */
export async function startCheckout(page: Page, lines: Line[] = [EMERALD_APE], search = '') {
  await login(page, 'ana@example.com')
  await addToCart(page, lines)
  await page.goto(`/checkout${search}`)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Souza')
  // A cotação chegou (o botão fica desabilitado até lá — e o Enter não envia o formulário).
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeEnabled()
}

export async function connectWallet(page: Page) {
  await page.getByRole('button', { name: /^Conectar (MetaMask|WalletConnect|Coinbase Wallet)$/ }).click()
  await expect(page.getByText(/^Carteira conectada: 0x/)).toBeVisible()
}

/** "Confirmar compra" → diálogo de revisão aberto. */
export async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(dialog).toBeVisible()
  return dialog
}

export async function ordersInDb(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('mock-db')!).orders.length as number)
}

import type { Page } from '@playwright/test'
import { fillLogin, login, logout } from './auth-helpers'
import { expect, test } from './fixtures'
import {
  addToCart,
  connectWallet,
  EMERALD_APE,
  GOLDEN_BEAT,
  openReview,
  ordersInDb,
  startCheckout,
} from './shop-helpers'

const receipt = (page: Page) => page.getByRole('dialog')
const PENDING = 'Confirmando seu pedido'
const CONFIRMED = 'Seus NFTs agora estão na sua carteira'

/** Do pagamento já aberto até a tela do pedido. */
async function payAndOpenOrder(page: Page) {
  await connectWallet(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/orders\/ord-/)
  return page.url().split('/orders/')[1]
}

test('compra completa: catálogo → detalhe → carrinho → login → pagamento → pendente → confirmado', async ({
  page,
  isMobile,
}) => {
  await page.goto('/?q=Golden+Beat#catalogo')
  await page
    .getByRole('link', { name: /Golden Beat #207/ })
    .first()
    .click()
  await page.getByRole('button', { name: isMobile ? 'Comprar NFT' : 'COMPRAR', exact: true }).click()
  await expect(page).toHaveURL('/cart')
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()

  // Visitante: o pagamento pede login e volta para ele.
  await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
  await fillLogin(page, 'ana@example.com')
  await expect(page).toHaveURL('/checkout')

  await payAndOpenOrder(page)
  await expect(receipt(page).getByRole('heading', { name: PENDING })).toBeVisible()
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toBeVisible()
  await expect(receipt(page).getByText('0.994 ETH').first()).toBeVisible() // 0.99 + taxa 0.004
  await expect(receipt(page).getByRole('link', { name: /Ver no Etherscan/ })).toHaveAttribute(
    'href',
    /^https:\/\/etherscan\.io\/tx\/0x[0-9a-f]{64}$/,
  )
})

test('confirmado: só os itens comprados saem do carrinho e o recibo não muda com o preço', async ({
  page,
  mockApi,
}) => {
  await startCheckout(page, [EMERALD_APE])
  await payAndOpenOrder(page)
  await expect(receipt(page).getByRole('heading', { name: PENDING })).toBeVisible()
  // Entra no carrinho DEPOIS do pedido: não faz parte da compra e tem que continuar lá.
  await addToCart(page, [GOLDEN_BEAT])
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toBeVisible()

  await mockApi.postJson('/api/__mock/nft-update', { ...EMERALD_APE, price: '9.99' })
  await page.reload()
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toBeVisible()
  await expect(receipt(page).getByText('2.38 ETH')).toBeVisible() // 1.19 × 2 do snapshot
  await expect(receipt(page).getByText('9.99 ETH')).toHaveCount(0)

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Golden Beat #207' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toHaveCount(0)
})

test('pagamento recusado (payment-rejected): tela de recusa e itens continuam no carrinho', async ({
  page,
  mockApi,
}) => {
  await mockApi.reset('payment-rejected')
  await startCheckout(page)
  await payAndOpenOrder(page)
  await expect(receipt(page).getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await expect(
    receipt(page).getByText('A rede recusou o pagamento: saldo insuficiente na carteira.'),
  ).toBeVisible()
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toHaveCount(0)

  await receipt(page).getByRole('link', { name: 'Voltar ao carrinho' }).click()
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()
})

test('resposta do pedido perdida (order-timeout): reenvia com a mesma chave e recupera o pedido', async ({
  page,
  mockApi,
}) => {
  await mockApi.reset('order-timeout')
  await startCheckout(page)
  await payAndOpenOrder(page)
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toBeVisible()
  expect(await ordersInDb(page)).toBe(1)
})

test('refresh com o pedido pendente continua acompanhando o mesmo pedido', async ({ page }) => {
  await startCheckout(page)
  const orderId = await payAndOpenOrder(page)
  await expect(receipt(page).getByRole('heading', { name: PENDING })).toBeVisible()
  await page.reload()
  await expect(page).toHaveURL(`/orders/${orderId}`)
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toBeVisible()
})

test('socket cai com o pedido pendente: reconecta e o resultado chega', async ({ page, mockApi }) => {
  await startCheckout(page)
  await payAndOpenOrder(page)
  await expect(receipt(page).getByRole('heading', { name: PENDING })).toBeVisible()
  await mockApi.postJson('/api/__mock/disconnect')
  // Sem esperar a consulta de segurança (10 s): a confirmação chega pelo socket reconectado.
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toBeVisible({ timeout: 6000 })
})

test('outro usuário não vê o pedido', async ({ page, isMobile }) => {
  await startCheckout(page)
  const orderId = await payAndOpenOrder(page)
  await expect(receipt(page).getByRole('heading', { name: CONFIRMED })).toBeVisible()

  await page.keyboard.press('Escape') // fechar volta ao início
  await expect(page).toHaveURL('/')
  await logout(page, isMobile)
  await login(page, 'bruno@example.com')
  await page.goto(`/orders/${orderId}`)
  await expect(receipt(page).getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
})

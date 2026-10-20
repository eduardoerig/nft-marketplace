import type { Page } from '@playwright/test'
import { login } from './auth-helpers'
import { expect, test } from './fixtures'

// "Comprar" no detalhe põe a edição escolhida no carrinho e leva até ele.
async function buyFromDetail(page: Page, nftId: string, isMobile: boolean) {
  await page.goto(`/nfts/${nftId}`)
  await page.getByRole('button', { name: isMobile ? 'Comprar NFT' : 'COMPRAR', exact: true }).click()
  await expect(page).toHaveURL('/cart')
}

const line = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name }) })
const summary = (page: Page) => page.getByRole('region', { name: 'Resumo da carteira' })

test('visitante: comprar leva ao carrinho; quantidade, remoção e refresh mantêm o estado', async ({
  page,
  isMobile,
}) => {
  await buyFromDetail(page, '1', isMobile) // Emerald Ape #042
  await buyFromDetail(page, '7', isMobile) // Golden Beat #207
  await expect(line(page, 'Emerald Ape #042')).toBeVisible()

  const golden = line(page, 'Golden Beat #207')
  const plus = golden.getByRole('button', { name: 'Aumentar quantidade' })
  await plus.click()
  await expect(golden.locator('output')).toHaveText('2')
  await plus.click()
  await expect(golden.locator('output')).toHaveText('3')

  await line(page, 'Emerald Ape #042')
    .getByRole('button', { name: /^Remover Emerald Ape #042/ })
    .click()
  await expect(line(page, 'Emerald Ape #042')).toHaveCount(0)

  await page.reload()
  await expect(golden.locator('output')).toHaveText('3')
  await expect(line(page, 'Emerald Ape #042')).toHaveCount(0)
  if (!isMobile) await expect(page.getByRole('link', { name: 'Carrinho, 3 itens' })).toBeVisible()
})

test('cotação: valores exatos com cupom e erros de cupom no campo', async ({ page, isMobile }) => {
  await buyFromDetail(page, '7', isMobile) // 0.99 ETH
  const golden = line(page, 'Golden Beat #207')
  await golden.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(golden.locator('output')).toHaveText('2')
  await golden.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(golden.locator('output')).toHaveText('3')

  // 0.99 × 3 em número do JavaScript daria 2.9699999999999998 — aqui tem que ser 2.97 exato.
  const box = summary(page)
  await expect(box.getByText('2.97 ETH', { exact: true })).toBeVisible()

  const coupon = box.getByLabel('Código promocional')
  for (const [code, message] of [
    ['XYZ', 'Este cupom não existe.'],
    ['EXPIRADO', 'Este cupom expirou.'],
  ]) {
    await coupon.fill(code)
    await box.getByRole('button', { name: 'Aplicar' }).click()
    await expect(coupon).toHaveAttribute('aria-invalid', 'true')
    await expect(box.getByRole('alert')).toHaveText(message)
  }

  await coupon.fill('desconto10') // minúsculas também valem
  await box.getByRole('button', { name: 'Aplicar' }).click()
  await expect(box.getByText('DESCONTO10')).toBeVisible()
  // subtotal 2.97 − desconto 0.297 (10%) + taxa 0.004 = 2.677
  await expect(box.getByText('(-) 0.297 ETH', { exact: true })).toBeVisible()
  await expect(box.getByText('0.004 ETH', { exact: true })).toBeVisible()
  await expect(box.getByText('2.677 ETH', { exact: true })).toBeVisible()

  // O cupom fica na URL: o refresh mantém o desconto.
  await expect(page).toHaveURL('/cart?cupom=DESCONTO10')
  await page.reload()
  await expect(summary(page).getByText('2.677 ETH', { exact: true })).toBeVisible()
})

test('login preserva os itens do carrinho de visitante', async ({ page, isMobile }) => {
  await buyFromDetail(page, '1', isMobile)
  await login(page, 'ana@example.com')
  await page.goto('/cart')
  await expect(line(page, 'Emerald Ape #042')).toBeVisible()
  // O carrinho de visitante foi incorporado e apagado no "servidor".
  const guestCarts = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('mock-db')!).carts.filter((c: { userId: string | null }) => !c.userId)
        .length,
  )
  expect(guestCarts).toBe(0)
})

test('limite por pedido: a edição 1/1 não passa de 1 unidade', async ({ page, isMobile }) => {
  const buyEdition11 = async () => {
    await page.goto('/nfts/1')
    await page
      .locator('label')
      .filter({ has: page.getByRole('radio', { name: /^1\/1\s*[,·]/ }) })
      .click()
    await page.getByRole('button', { name: isMobile ? 'Comprar NFT' : 'COMPRAR', exact: true }).click()
  }
  await buyEdition11()
  await expect(page).toHaveURL('/cart')
  await expect(
    line(page, 'Emerald Ape #042').getByRole('button', { name: 'Aumentar quantidade' }),
  ).toBeDisabled()

  // Comprar de novo a mesma edição: a API recusa (409 OUT_OF_STOCK) e a mensagem aparece.
  await buyEdition11()
  await expect(page.getByText('Emerald Ape #042: no máximo 1 nesta edição.')).toBeVisible()
  await expect(page).toHaveURL('/nfts/1')
})

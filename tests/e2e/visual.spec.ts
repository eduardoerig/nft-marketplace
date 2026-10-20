// Regressão visual: Início, Detalhe, Carrinho e Pagamento, em desktop e mobile.
// Dados fixos (fixtures do mock, estado resetado), animações e troca automática do hero desligadas.
// Baselines em visual.spec.ts-snapshots/ (geradas no Windows; em outro sistema, gere de novo com
// `pnpm test:e2e:update` — cada sistema desenha as fontes de um jeito).
import type { Page } from '@playwright/test'
import { login } from './auth-helpers'
import { expect, test } from './fixtures'
import { addToCart, EMERALD_APE, GOLDEN_BEAT, startCheckout } from './shop-helpers'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }) // o hero não troca sozinho
})

/** Espera dados, imagens e fontes; esconde o botão do painel de testes (só existe com mocks). */
async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.addStyleTag({
    content: '[aria-label="Painel de testes da API simulada"]{display:none!important}',
  })
  await page.evaluate(async () => {
    await document.fonts.ready
    // Só as imagens visíveis na tela (as escondidas têm tamanho 0 e, se forem lazy, nunca carregam).
    const visible = [...document.images].filter((img) => {
      const rect = img.getBoundingClientRect()
      return rect.width > 0 && rect.top < window.innerHeight
    })
    const loaded = Promise.all(visible.map((img) => (img.complete ? null : img.decode().catch(() => null))))
    await Promise.race([loaded, new Promise((resolve) => setTimeout(resolve, 5000))])
  })
}

const options = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } as const

test('Início', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('list', { name: 'NFTs', exact: true }).getByRole('listitem').first(),
  ).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('inicio.png', options)
})

test('Detalhe', async ({ page }) => {
  await page.goto('/nfts/1')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('detalhe.png', options)
})

test('Carrinho', async ({ page }) => {
  await login(page, 'ana@example.com')
  await addToCart(page, [EMERALD_APE, GOLDEN_BEAT])
  await page.goto('/cart')
  await expect(page.getByText('3.378 ETH', { exact: true })).toBeVisible() // 2.38 + 0.99 + taxa 0.008
  await settle(page)
  await expect(page).toHaveScreenshot('carrinho.png', options)
})

test('Pagamento', async ({ page }) => {
  await startCheckout(page, [EMERALD_APE, GOLDEN_BEAT])
  await expect(page.getByText('3.378 ETH').first()).toBeVisible()
  await settle(page)
  await expect(page).toHaveScreenshot('pagamento.png', options)
})

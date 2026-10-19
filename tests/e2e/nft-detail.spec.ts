import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

// Rádio de edição pelo nome visível ("1/10"). O resto do nome acessível é o preço ou "Esgotada";
// o Chrome põe um espaço antes do texto escondido (sr-only), por isso o \s*.
const edition = (page: Page, name: string) =>
  page.getByRole('radio', { name: new RegExp(`^${name}\\s*[,·]`) })

// O usuário clica na pílula (o <label>), não no <input> escondido.
const pickEdition = (page: Page, name: string) =>
  page
    .locator('label')
    .filter({ has: edition(page, name) })
    .click()

test('acesso direto ao detalhe mostra os dados do NFT', async ({ page }) => {
  await page.goto('/nfts/1')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(page).toHaveTitle('Detalhes do NFT — Kurio')
  await expect(page.getByText('ID do token:')).toBeVisible()
  // Edição inicial = a mais barata disponível (1/50, como no Figma).
  await expect(edition(page, '1/50')).toBeChecked()
})

test('ID inexistente mostra "NFT não encontrado"', async ({ page }) => {
  await page.goto('/nfts/nao-existe')
  await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
  await page.getByRole('link', { name: 'Explorar o catálogo' }).click()
  await expect(page).toHaveURL('/#catalogo')
})

test('edição esgotada fica desabilitada e diz "Esgotada"', async ({ page }) => {
  await page.goto('/nfts/3') // Neon Vessel: a 1/10 está esgotada nas fixtures
  const soldOut = edition(page, '1/10')
  await expect(soldOut).toBeDisabled()
  await expect(soldOut).toHaveAccessibleName(/Esgotada/)
})

test('quantidade respeita o limite da edição', async ({ page }) => {
  await page.goto('/nfts/1')
  const stepper = page.getByRole('group', { name: 'Quantidade de Emerald Ape #042' })
  const plus = stepper.getByRole('button', { name: 'Aumentar quantidade' })
  const value = stepper.locator('output')

  // 1/10: 6 disponíveis, máximo 3 por pedido → para em 3.
  await pickEdition(page, '1/10')
  for (let i = 0; i < 5; i++) if (await plus.isEnabled()) await plus.click()
  await expect(value).toHaveText('3')
  await expect(plus).toBeDisabled()

  // Trocar para 1/1 (máximo 1) ajusta a quantidade para baixo.
  await pickEdition(page, '1/1')
  await expect(value).toHaveText('1')
  await expect(plus).toBeDisabled()
  await expect(stepper.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()
})

test('galeria troca a imagem pelas setas do teclado e amplia', async ({ page, isMobile }) => {
  test.skip(isMobile, 'miniaturas só existem no desktop')
  await page.goto('/nfts/1')
  const main = page.getByRole('img', { name: /Emerald Ape #042 — imagem/ }).first()
  await expect(main).toHaveAccessibleName('Emerald Ape #042 — imagem 1 de 4')

  await page.getByRole('button', { name: 'Mostrar imagem 1 de 4' }).focus()
  await page.keyboard.press('ArrowDown')
  await expect(main).toHaveAccessibleName('Emerald Ape #042 — imagem 2 de 4')
  await expect(page.getByRole('button', { name: 'Mostrar imagem 2 de 4' })).toBeFocused()

  await page.getByRole('button', { name: 'Ampliar imagem' }).click()
  const dialog = page.getByRole('dialog', { name: 'Emerald Ape #042' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('ações ainda não implementadas não simulam sucesso', async ({ page, isMobile }) => {
  await page.goto('/nfts/1')
  const buy = page.getByRole('button', { name: isMobile ? /Comprar NFT/ : /COMPRAR/ })
  await expect(buy).toHaveAttribute('aria-disabled', 'true')
  // Pelo teclado (o Playwright não clica em elemento aria-disabled): foca, mostra a dica e nada acontece.
  await buy.focus()
  await expect(page.getByRole('tooltip', { name: 'Em breve' })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/nfts/1')
})

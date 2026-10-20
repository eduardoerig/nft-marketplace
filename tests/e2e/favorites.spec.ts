import type { Page } from '@playwright/test'
import { login } from './auth-helpers'
import { expect, test } from './fixtures'

// Favoritos da Ana gravados no banco simulado. Usado para esperar a API confirmar antes do
// refresh: recarregar no meio da requisição a cancelaria (o otimista já mostrou o coração).
const savedFavorites = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('mock-db')!).favorites['user-ana'] ?? [])

test('favoritar no detalhe e no card persiste após refresh', async ({ page, isMobile }) => {
  await login(page, 'ana@example.com')
  await page.goto('/nfts/1')
  // Desktop: botão "Favoritar" com texto. Mobile: coração sobre a imagem.
  const heart = isMobile
    ? page.getByRole('button', { name: 'Favoritar Emerald Ape #042' })
    : page.getByRole('button', { name: 'Favoritar', exact: true })
  await expect(heart).toHaveAttribute('aria-pressed', 'false')
  await heart.click()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => savedFavorites(page)).toContain('1')

  await page.reload()
  await expect(heart).toHaveAttribute('aria-pressed', 'true')

  // O card do mesmo NFT no catálogo já aparece favoritado; desfavoritar por ele também persiste.
  await page.goto('/')
  const cardHeart = page.getByRole('button', { name: 'Favoritar Emerald Ape #042' })
  await expect(cardHeart).toHaveAttribute('aria-pressed', 'true')
  await cardHeart.click()
  await expect(cardHeart).toHaveAttribute('aria-pressed', 'false')
  await expect.poll(() => savedFavorites(page)).not.toContain('1')
  await page.reload()
  await expect(cardHeart).toHaveAttribute('aria-pressed', 'false')
})

test('deslogado, o coração abre o login sem sair da página', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).click()
  await expect(page).toHaveURL('/?auth=login')
  await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
})

test('falha ao favoritar: o coração acende, volta sozinho e aparece o aviso', async ({ page, mockApi }) => {
  await mockApi.reset('favorites-fail')
  await login(page, 'ana@example.com')
  await page.goto('/')
  const cardHeart = page.getByRole('button', { name: 'Favoritar Emerald Ape #042' })

  await cardHeart.click()
  // Otimista: muda na hora, antes da resposta (o cenário responde em 400 ms)...
  await expect(cardHeart).toHaveAttribute('aria-pressed', 'true')
  // ...e a API falha: o aviso aparece e, NO MESMO INSTANTE, o coração já voltou (rollback no
  // onError). Lido sem esperar: sem o rollback ele só voltaria ~400 ms depois, com a nova busca.
  await expect(page.getByText('Não foi possível favoritar. Tente de novo.')).toBeVisible()
  expect(await cardHeart.getAttribute('aria-pressed')).toBe('false')
})

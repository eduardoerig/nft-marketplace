import type { NftListResponse } from '../../src/api/types'
import { expect, test } from './fixtures'

test('home carrega e a API simulada responde com os NFTs', async ({ page, mockApi, isMobile }) => {
  await page.goto('/')
  // Títulos do Figma: o hero mobile tem a versão curta.
  const title = isMobile ? 'Seja dono da cultura digital' : 'Seja dono do futuro da arte digital'
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(page).toHaveTitle('Kurio — Marketplace de NFTs')

  // A requisição sai da página e é respondida pelo MSW (service worker), como no app.
  const { status, body } = await mockApi.getJson<NftListResponse>('/api/nfts?pageSize=3')
  expect(status).toBe(200)
  expect(body.total).toBe(60)
  expect(body.items.map((n) => n.name)).toEqual(['Emerald Ape #042', 'Sage Nomad #009', 'Neon Vessel #552'])
})

test('rota inexistente mostra a página 404', async ({ page }) => {
  await page.goto('/qualquer-coisa')
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('/')
})

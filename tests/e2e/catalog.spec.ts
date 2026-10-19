import type { Page } from '@playwright/test'
import type { NftListResponse } from '../../src/api/types'
import { expect, test } from './fixtures'

// Nomes dos cards visíveis na grade.
const gridNames = (page: Page) =>
  page.getByRole('list', { name: 'NFTs' }).getByRole('heading', { level: 3 }).allTextContents()

// Filtros: sidebar no desktop; no mobile, abre o painel pelo botão "Filtros".
async function filters(page: Page, isMobile: boolean) {
  if (!isMobile) return page.getByRole('complementary', { name: 'Filtros' })
  await page.getByRole('button', { name: 'Filtros' }).click()
  return page.getByRole('dialog', { name: 'Filtros' })
}

test('busca, filtros combinados, ordenação, paginação e histórico', async ({ page, mockApi, isMobile }) => {
  // Lista esperada = o que a API simulada responde para os mesmos parâmetros.
  const expectGrid = async (query: string) => {
    const { body } = await mockApi.getJson<NftListResponse>(`/api/nfts?pageSize=9&${query}`)
    await expect.poll(() => gridNames(page)).toEqual(body.items.map((n) => n.name))
  }

  await page.goto('/')
  const search = page.getByRole('searchbox', { name: 'Buscar NFTs por nome ou coleção' })

  // 1. Busca (com debounce) vai para a URL.
  await search.fill('nomad')
  await expect(page).toHaveURL(/\?q=nomad$/)
  await expectGrid('q=nomad')
  expect(await gridNames(page)).not.toHaveLength(0)
  for (const name of await gridNames(page)) expect(name).toContain('Nomad')

  // 2. Limpa a busca e ordena por maior preço.
  await search.fill('')
  await expect(page).toHaveURL(/\/$/)
  await page.getByRole('combobox', { name: 'Ordenar por:' }).click()
  await page.getByRole('option', { name: 'Maior preço' }).click()
  await expect(page).toHaveURL(/sort=price-desc/)
  await expectGrid('sort=price-desc')

  // 3. Página 2.
  await page.getByRole('link', { name: 'Página 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expectGrid('sort=price-desc&page=2')

  // 4. Filtro de coleção volta para a página 1; depois combina com rede.
  await (await filters(page, isMobile)).getByRole('link', { name: /Música/ }).click()
  await expect(page).toHaveURL(/category=music/)
  await expect(page).not.toHaveURL(/page=/)
  await (await filters(page, isMobile)).getByRole('link', { name: /Polygon/ }).click()
  await expect(page).toHaveURL(/category=music/)
  await expect(page).toHaveURL(/network=polygon/)
  await expectGrid('sort=price-desc&category=music&network=polygon')

  // 5. Voltar desfaz passo a passo; refresh mantém o estado.
  await page.goBack()
  await expect(page).not.toHaveURL(/network=/)
  await expectGrid('sort=price-desc&category=music')
  await page.goBack()
  await expect(page).toHaveURL(/page=2/)
  await expectGrid('sort=price-desc&page=2')
  await page.reload()
  await expect(page).toHaveURL(/page=2/)
  await expectGrid('sort=price-desc&page=2')
  await expect(page.getByRole('link', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
})

test('busca sem resultado mostra o estado vazio e permite limpar', async ({ page }) => {
  await page.goto('/?q=zzzz')
  const empty = page.getByRole('region', { name: 'Nenhum NFT encontrado' })
  await expect(empty).toBeVisible()
  await empty.getByRole('link', { name: 'Limpar filtros' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect.poll(() => gridNames(page)).toHaveLength(9)
})

test('parâmetros inválidos na URL voltam ao padrão sem quebrar a tela', async ({ page }) => {
  await page.goto('/?page=abc&sort=zzz&category=nao-existe')
  await expect.poll(() => gridNames(page)).toHaveLength(9)
  expect((await gridNames(page))[0]).toBe('Emerald Ape #042')
})

test('card leva ao detalhe do NFT', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('link', { name: /Emerald Ape #042/ })
    .first()
    .click()
  await expect(page).toHaveURL('/nfts/1')
})

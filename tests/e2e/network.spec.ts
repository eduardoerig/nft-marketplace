// Cenários de rede e de falha (src/mocks/scenarios.ts). Cada teste escolhe o cenário com
// mockApi.reset(nome) — o mesmo que ?scenario= e o painel de testes fazem — e olha só a tela.
import { fillLogin } from './auth-helpers'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { connectWallet, openReview, ordersInDb, startCheckout } from './shop-helpers'

const grid = (page: Page) => page.getByRole('list', { name: 'NFTs', exact: true })

test('slow: skeletons enquanto carrega e depois os cards', async ({ page, mockApi }) => {
  await mockApi.reset('slow')
  await page.goto('/')
  await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toBeVisible()
  await expect(grid(page).getByRole('listitem').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('list', { name: 'Carregando NFTs' })).toHaveCount(0)
})

test('server-error: mensagem clara e "Tentar novamente" recupera', async ({ page, mockApi }) => {
  await mockApi.reset('server-error')
  await page.goto('/')
  // 1ª tentativa + 2 novas tentativas automáticas falham (o cenário falha 3 vezes por rota).
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs.' })
  await expect(alert).toBeVisible({ timeout: 15_000 })
  await expect(alert).toContainText('O servidor está instável agora.')
  await alert.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(grid(page).getByRole('listitem').first()).toBeVisible()
})

test('offline: avisa que está sem conexão', async ({ page, mockApi }) => {
  await mockApi.reset('offline')
  await page.goto('/')
  const alert = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar os NFTs.' })
  await expect(alert).toBeVisible({ timeout: 15_000 })
  await expect(alert).toContainText('Sem conexão com o servidor.')
})

test('empty: catálogo sem NFTs mostra o estado vazio', async ({ page, mockApi }) => {
  await mockApi.reset('empty')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await expect(page.getByText('Ainda não há NFTs à venda no mercado.')).toBeVisible()
})

test('out-of-order: a resposta antiga que chega depois não substitui a nova', async ({ page, mockApi }) => {
  await mockApi.reset('out-of-order')
  await page.goto('/?category=music#catalogo')
  await expect(grid(page).getByRole('listitem').first()).toBeVisible({ timeout: 10_000 })
  // Duas buscas seguidas: a 1ª (lenta) responde depois da 2ª (rápida).
  const golden = requestSettled(page, /\/api\/nfts\?.*q=Golden/)
  await page.goto('/?q=Golden#catalogo')
  await page.getByRole('searchbox').first().fill('Ape')
  await page.getByRole('searchbox').first().press('Enter')
  await expect(page).toHaveURL(/q=Ape/)
  // Espera a resposta lenta terminar (ou ser cancelada pelo app) em vez de um tempo fixo.
  await golden
  await expect
    .poll(async () => {
      const names = await grid(page).getByRole('heading').allInnerTexts()
      return names.length > 0 && names.every((name) => /Ape/.test(name))
    })
    .toBe(true)
})

/** Resolve quando a requisição que casa com `url` termina — com resposta ou cancelada (AbortController). */
function requestSettled(page: Page, url: RegExp) {
  return Promise.race([
    page.waitForEvent('requestfinished', (request) => url.test(request.url())),
    page.waitForEvent('requestfailed', (request) => url.test(request.url())),
  ])
}

test('register-conflict: o e-mail já usado aparece no campo', async ({ page, mockApi }) => {
  await mockApi.reset('register-conflict')
  await page.goto('/register')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome de usuário').fill('nova')
  await dialog.getByLabel('E-mail').fill('nova@example.com')
  await dialog.getByLabel('Senha', { exact: true }).fill('Senha@123')
  await dialog.getByLabel('Confirmar senha').fill('Senha@123')
  await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
  await expect(dialog.getByLabel('E-mail')).toHaveAccessibleDescription('Este e-mail já está cadastrado.')
})

test('session-expired: depois do login, a próxima chamada avisa que a sessão expirou', async ({
  page,
  mockApi,
}) => {
  await mockApi.reset('session-expired')
  await page.goto('/login')
  await fillLogin(page, 'ana@example.com')
  await expect(page.getByText('Sua sessão expirou. Entre novamente.')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('session-token'))).toBeNull()
})

test('price-change-checkout: o 1º envio encontra o preço mudado e pede nova confirmação', async ({
  page,
  mockApi,
}) => {
  await mockApi.reset('price-change-checkout')
  await startCheckout(page)
  await connectWallet(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Emerald Ape #042 (1/50): 1.19 ETH → 1.29 ETH.')
  await dialog.getByRole('button', { name: 'Aceitar os novos valores' }).click()
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/orders\/ord-/)
})

test('sold-out-checkout: item esgota ao confirmar e o pedido não é criado', async ({ page, mockApi }) => {
  await mockApi.reset('sold-out-checkout')
  await startCheckout(page)
  await connectWallet(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  // Duas telas válidas, conforme o que chega primeiro: a resposta 409 do pedido (aviso dentro da revisão) ou o
  // `nft.updated` do socket, que refaz a cotação e troca o formulário inteiro pelo aviso da página. Por isso o
  // aviso e o link são procurados na página, não só no diálogo.
  const soldOut = page.getByRole('alert').filter({ hasText: 'Emerald Ape #042 esgotou nesta edição.' })
  await expect(soldOut.last()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Voltar ao carrinho', exact: true }).last()).toBeVisible()
  expect(await ordersInDb(page)).toBe(0)
})

test('painel de testes troca o cenário e reseta os dados', async ({ page }) => {
  await page.goto('/')
  await expect(grid(page).getByRole('listitem').first()).toBeVisible()
  await page.getByRole('button', { name: 'Painel de testes da API simulada' }).click()
  const panel = page.getByRole('dialog', { name: 'Painel de testes' })
  await panel.getByLabel('Cenário').selectOption('empty')
  await expect(panel.getByText('Catálogo vazio')).toBeVisible()
  await panel.getByRole('button', { name: 'Aplicar cenário' }).click()

  await expect(page.getByRole('heading', { name: 'Nenhum NFT encontrado' })).toBeVisible()
  await page.getByRole('button', { name: 'Painel de testes da API simulada' }).click()
  await panel.getByLabel('Cenário').selectOption('default')
  await panel.getByRole('button', { name: 'Aplicar cenário' }).click()
  await expect(grid(page).getByRole('listitem').first()).toBeVisible()
})

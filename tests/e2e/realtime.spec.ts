// Tempo real: os eventos saem do "servidor" simulado (src/mocks/realtime.ts) e chegam ao app pelo
// socket.io-client. Os testes só disparam mudanças pelas rotas de controle e olham a tela.
import type { Page } from '@playwright/test'
import type { NftUpdatedEvent } from '../../src/api/types'
import { expect, test } from './fixtures'

const GOLDEN_BEAT = { nftId: '7', editionId: 'ed-1-50' } // 0.99 ETH, edição selecionada por padrão

// Detalhe tem o layout desktop e o mobile na página (um deles oculto): olha só o visível.
const shown = (page: Page, text: string) => page.getByText(text).filter({ visible: true }).first()
const summary = (page: Page) => page.getByRole('region', { name: 'Resumo da carteira' })

test('nft.updated muda o preço no detalhe e no catálogo sem recarregar', async ({ page, mockApi }) => {
  await page.goto('/nfts/7')
  await expect(shown(page, '0.99 ETH')).toBeVisible()
  await mockApi.waitForSocket()

  await mockApi.postJson('/api/__mock/nft-update', { ...GOLDEN_BEAT, price: '0.45' })
  await expect(shown(page, '0.45 ETH')).toBeVisible()

  await page.goto('/?q=Golden+Beat#catalogo')
  const card = page
    .getByRole('listitem')
    .filter({ has: page.getByRole('link', { name: /Golden Beat #207/ }) })
  await expect(card.getByText('0.45 ETH')).toBeVisible()
  await mockApi.waitForSocket()

  await mockApi.postJson('/api/__mock/nft-update', { ...GOLDEN_BEAT, price: '0.35' })
  await expect(card.getByText('0.35 ETH')).toBeVisible()
})

test('evento antigo ou duplicado não regride o detalhe', async ({ page, mockApi }) => {
  await page.goto('/nfts/7')
  await mockApi.waitForSocket()

  const older = await mockApi.postJson<NftUpdatedEvent>('/api/__mock/nft-update', {
    ...GOLDEN_BEAT,
    price: '0.45',
  })
  await expect(shown(page, '0.45 ETH')).toBeVisible()
  const newer = await mockApi.postJson<NftUpdatedEvent>('/api/__mock/nft-update', {
    ...GOLDEN_BEAT,
    price: '0.35',
  })
  await expect(shown(page, '0.35 ETH')).toBeVisible()

  // O servidor reenvia o evento antigo (versão menor): a tela não pode voltar para 0.45.
  // (Cada reenvio é conferido sozinho: se o novo viesse logo atrás, ele "consertaria" a tela.)
  // Espera fixa de propósito: o teste prova uma AUSÊNCIA de mudança, então não há elemento pelo qual esperar.
  // Um evento "marcador" depois do reenvio não serve — ele traz o estado atual e esconderia a regressão.
  await mockApi.postJson('/api/__mock/replay', { eventId: older.body.eventId })
  await page.waitForTimeout(500)
  await expect(shown(page, '0.35 ETH')).toBeVisible()
  await expect(page.getByText('0.45 ETH').filter({ visible: true })).toHaveCount(0)

  // E o mais novo repetido (mesmo eventId) também não muda nada.
  await mockApi.postJson('/api/__mock/replay', { eventId: newer.body.eventId })
  await page.waitForTimeout(500)
  await expect(shown(page, '0.35 ETH')).toBeVisible()
})

test('carrinho: mudança de preço mostra aviso e atualiza o resumo', async ({ page, isMobile, mockApi }) => {
  await page.goto('/nfts/7')
  await page.getByRole('button', { name: isMobile ? 'Comprar NFT' : 'COMPRAR', exact: true }).click()
  await expect(page).toHaveURL('/cart')
  await expect(summary(page).getByText('0.994 ETH', { exact: true })).toBeVisible() // 0.99 + taxa 0.004
  await mockApi.waitForSocket()

  const event = await mockApi.postJson<NftUpdatedEvent>('/api/__mock/nft-update', {
    ...GOLDEN_BEAT,
    price: '1.5',
  })
  const notices = page.getByRole('status', { name: 'Mudanças no carrinho' })
  await expect(notices).toHaveText('O preço de Golden Beat #207 (1/50) mudou de 0.99 ETH para 1.50 ETH.')
  await expect(summary(page).getByText('1.504 ETH', { exact: true })).toBeVisible()

  // O mesmo evento de novo não gera um segundo aviso.
  await mockApi.postJson('/api/__mock/replay', { eventId: event.body.eventId })
  await page.waitForTimeout(500)
  await expect(notices.getByRole('listitem')).toHaveCount(1)

  // Disponibilidade abaixo da quantidade: aviso e finalizar bloqueado.
  await mockApi.postJson('/api/__mock/nft-update', { ...GOLDEN_BEAT, available: 0 })
  await expect(notices).toContainText('Golden Beat #207 (1/50) esgotou.')
  await expect(page.getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
})

test('evento perdido durante a desconexão é recuperado do REST ao reconectar', async ({ page, mockApi }) => {
  await page.goto('/nfts/7')
  await expect(shown(page, '0.99 ETH')).toBeVisible()
  await mockApi.waitForSocket()

  // Muda no "servidor" sem emitir (o evento se perdeu) e derruba a conexão. Sem evento, não há o que esperar.
  await mockApi.postJson('/api/__mock/nft-update', { ...GOLDEN_BEAT, price: '0.25', silent: true })
  await expect(page.getByText('0.25 ETH').filter({ visible: true })).toHaveCount(0)
  await mockApi.postJson('/api/__mock/disconnect')

  // O socket.io-client reconecta sozinho e o app busca de novo o que está na tela.
  await expect(shown(page, '0.25 ETH')).toBeVisible()
})

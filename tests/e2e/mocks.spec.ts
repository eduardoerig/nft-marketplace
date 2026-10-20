import { expect, test } from './fixtures'

// Aba em segundo plano por muito tempo: o Chrome desliga o service worker ocioso e, ao religar,
// ele esquece quais abas estavam com a API simulada — tudo passa direto para o servidor.
// Aqui forçamos esse desligamento e conferimos que o app se recupera ao voltar para a aba.
test('API simulada volta a responder depois que o navegador desliga o service worker', async ({
  page,
  mockApi,
}) => {
  await page.goto('/nfts/1')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('ServiceWorker.enable')
  await cdp.send('ServiceWorker.stopAllWorkers')

  // A pessoa volta para a aba.
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))

  await expect
    .poll(async () => (await mockApi.getJson<{ id: string }>('/api/nfts/1').catch(() => null))?.body?.id)
    .toBe('1')
})

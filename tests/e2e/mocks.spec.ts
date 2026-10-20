import { expect, test } from './fixtures'

// `ServiceWorker.stopAllWorkers` (CDP) às vezes fecha a própria aba sob carga (~1 em 20 execuções:
// "Target page… has been closed" logo depois do comando). É um efeito da automação, não do app — por
// isso este arquivo, e só ele, tem novas tentativas. Uma falha real (o MSW não religar) falha sempre.
test.describe.configure({ retries: 2 })

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

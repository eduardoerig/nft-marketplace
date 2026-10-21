// A API simulada não liga (service worker recusado ou travado): a tela mostra o erro com "Tentar novamente"
// em vez de skeletons sem fim. Exceção à regra "importe de ./fixtures": a fixture automática liga o MSW antes
// do teste, e aqui o objetivo é justamente o MSW NÃO ligar.
import { expect, test, type Page } from '@playwright/test'

const WORKER = '**/mockServiceWorker.js'

const unavailable = (page: Page) =>
  page.getByRole('alert').filter({ hasText: 'Não foi possível iniciar a API simulada' })
const firstCard = (page: Page) =>
  page.getByRole('list', { name: 'NFTs', exact: true }).getByRole('listitem').first()

test('worker recusado (403): mostra o erro e "Tentar novamente" recupera', async ({ page }) => {
  // O script do service worker é baixado pelo navegador, não pela página: só a rota do contexto o intercepta.
  await page.context().route(WORKER, (route) => route.fulfill({ status: 403, body: 'Forbidden' }))
  await page.goto('/')
  await expect(unavailable(page)).toBeVisible()
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)

  // Com o worker liberado, recarregar (o botão) liga a API e o catálogo aparece.
  await page.context().unroute(WORKER)
  await unavailable(page).getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(firstCard(page)).toBeVisible()
  await expect(unavailable(page)).toHaveCount(0)
})

test('worker travado: depois de 15 s mostra o erro', async ({ page }) => {
  await page.clock.install()
  // Nunca responde: o registro do service worker fica pendurado.
  await page.context().route(WORKER, () => {})
  await page.goto('/')
  await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()
  await expect(unavailable(page)).toHaveCount(0)

  await page.clock.fastForward('00:16')
  await expect(unavailable(page)).toBeVisible()
})

// Fixtures compartilhadas dos testes E2E. Importe `test` e `expect` DAQUI, não de @playwright/test.
import { test as base, expect, type Page } from '@playwright/test'

type MockApi = {
  /** Restaura o estado inicial de um cenário (POST /api/__mock/reset). */
  reset: (scenario?: string) => Promise<void>
  /** GET na API simulada a partir da página — passa pelo service worker do MSW. */
  getJson: <T = unknown>(path: string) => Promise<{ status: number; body: T }>
}

// As requisições precisam sair da PÁGINA (não do `page.request`), senão não passam pelo MSW.
// Depois de goto/reload, espere o MSW ligar: antes disso a chamada vai direto ao servidor.
async function waitForMocks(page: Page) {
  await page.waitForFunction(() => (window as Window & { __mocksReady?: boolean }).__mocksReady === true)
}

export const test = base.extend<{ mockApi: MockApi }>({
  mockApi: [
    async ({ page }, use) => {
      await page.goto('/')
      await waitForMocks(page)

      const mockApi: MockApi = {
        reset: async (scenario = 'default') => {
          await waitForMocks(page)
          const status = await page.evaluate(async (s) => {
            const res = await fetch('/api/__mock/reset', {
              method: 'POST',
              body: JSON.stringify({ scenario: s }),
            })
            return res.status
          }, scenario)
          expect(status, `reset do cenário "${scenario}"`).toBe(200)
        },
        getJson: async (path) => {
          await waitForMocks(page)
          return page.evaluate(async (p) => {
            const res = await fetch(p)
            return { status: res.status, body: await res.json() }
          }, path)
        },
      }

      // Todo teste começa do estado conhecido.
      await mockApi.reset()
      await use(mockApi)
    },
    { auto: true },
  ],
})

export { expect }

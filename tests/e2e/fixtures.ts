// Fixtures compartilhadas dos testes E2E. Importe `test` e `expect` DAQUI, não de @playwright/test.
import { test as base, expect, type Page } from '@playwright/test'

type MockApi = {
  /** Restaura o estado inicial de um cenário (POST /api/__mock/reset). */
  reset: (scenario?: string) => Promise<void>
  /** GET na API simulada a partir da página — passa pelo service worker do MSW. */
  getJson: <T = unknown>(path: string) => Promise<{ status: number; body: T }>
}

// As requisições precisam sair da PÁGINA (não do `page.request`), senão não passam pelo MSW.
async function waitForMockWorker(page: Page) {
  await page.waitForFunction(() => navigator.serviceWorker?.controller != null)
}

export const test = base.extend<{ mockApi: MockApi }>({
  mockApi: [
    async ({ page }, use) => {
      await page.goto('/')
      await waitForMockWorker(page)

      const mockApi: MockApi = {
        reset: async (scenario = 'default') => {
          const status = await page.evaluate(async (s) => {
            const res = await fetch('/api/__mock/reset', {
              method: 'POST',
              body: JSON.stringify({ scenario: s }),
            })
            return res.status
          }, scenario)
          expect(status, `reset do cenário "${scenario}"`).toBe(200)
        },
        getJson: (path) =>
          page.evaluate(async (p) => {
            const res = await fetch(p)
            return { status: res.status, body: await res.json() }
          }, path),
      }

      // Todo teste começa do estado conhecido.
      await mockApi.reset()
      await use(mockApi)
    },
    { auto: true },
  ],
})

export { expect }

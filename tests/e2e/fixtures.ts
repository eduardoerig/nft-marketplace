// Fixtures compartilhadas dos testes E2E. Importe `test` e `expect` DAQUI, não de @playwright/test.
import { test as base, expect, type Page } from '@playwright/test'

type MockApi = {
  /** Restaura o estado inicial de um cenário (POST /api/__mock/reset). */
  reset: (scenario?: string) => Promise<void>
  /** GET na API simulada a partir da página — passa pelo service worker do MSW. */
  getJson: <T = unknown>(path: string) => Promise<{ status: number; body: T }>
  /** POST na API simulada a partir da página (rotas de controle como /api/__mock/nft-update). */
  postJson: <T = unknown>(path: string, body?: unknown) => Promise<{ status: number; body: T }>
  /** Espera o socket.io-client da página estar conectado ao "servidor" simulado. */
  waitForSocket: () => Promise<void>
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
        postJson: async (path, body) => {
          await waitForMocks(page)
          return page.evaluate(
            async ([p, b]) => {
              const res = await fetch(p, { method: 'POST', body: JSON.stringify(b ?? {}) })
              return { status: res.status, body: res.status === 204 ? null : await res.json() }
            },
            [path, body] as const,
          )
        },
        waitForSocket: async () => {
          await expect
            .poll(
              async () => (await mockApi.getJson<{ count: number }>('/api/__mock/connections')).body.count,
            )
            .toBeGreaterThan(0)
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

// Liga a API simulada no navegador. Só é importado quando VITE_ENABLE_MOCKS=true (ver src/main.tsx).
import { setupWorker } from 'msw/browser'
import { resetDb } from './db'
import { handlers } from './handlers'
import { getScenarioName, isScenarioName } from './scenarios'

declare global {
  interface Window {
    /** true quando o MSW já intercepta as requisições (os testes E2E esperam por isto). */
    __mocksReady?: boolean
  }
}

const worker = setupWorker(...handlers)

const startOptions: Parameters<typeof worker.start>[0] = {
  // Só reclama de chamadas à API sem handler; imagens, fontes e scripts passam direto.
  onUnhandledFrame({ frame, defaults }) {
    const { request } = frame.data as { request?: Request }
    if (request && new URL(request.url).pathname.startsWith('/api/')) defaults.warn()
  },
}

export async function startMocks() {
  // ?scenario=<nome> troca o cenário e restaura o estado inicial dele.
  const requested = new URLSearchParams(window.location.search).get('scenario')
  if (isScenarioName(requested) && requested !== getScenarioName()) resetDb(requested)

  await worker.start(startOptions)
  window.__mocksReady = true

  // Com a aba em segundo plano, o Chrome desliga o service worker ocioso; ao religar, ele esquece
  // esta aba e as requisições passam direto para o servidor (que devolve HTML). Ao voltar para a
  // aba, confere se a API simulada ainda responde e, se não, liga o worker de novo.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void reviveIfStopped()
  })
}

async function reviveIfStopped() {
  const res = await fetch('/api/__mock/ping').catch(() => null)
  if (res?.headers.get('content-type')?.includes('json')) return
  window.__mocksReady = false
  worker.stop()
  await worker.start(startOptions)
  window.__mocksReady = true
}

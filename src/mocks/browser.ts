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

export async function startMocks() {
  // ?scenario=<nome> troca o cenário e restaura o estado inicial dele.
  const requested = new URLSearchParams(window.location.search).get('scenario')
  if (isScenarioName(requested) && requested !== getScenarioName()) resetDb(requested)

  const worker = setupWorker(...handlers)
  await worker.start({
    // Só reclama de chamadas à API sem handler; imagens, fontes e scripts passam direto.
    onUnhandledFrame({ frame, defaults }) {
      const { request } = frame.data as { request?: Request }
      if (request && new URL(request.url).pathname.startsWith('/api/')) defaults.warn()
    },
  })
  window.__mocksReady = true
}

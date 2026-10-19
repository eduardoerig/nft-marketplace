// Rotas de controle da simulação (usadas pela demo e pelos testes E2E). Não fazem parte da API real.
import { http } from 'msw'
import { resetDb } from '../db'
import { isScenarioName } from '../scenarios'
import { fail, ok } from './respond'

export const mockControlHandlers = [
  // POST /api/__mock/reset { scenario? } → restaura o estado inicial do cenário.
  http.post('/api/__mock/reset', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { scenario?: unknown }
    const scenario = body.scenario ?? 'default'
    if (!isScenarioName(scenario)) return fail('VALIDATION', `Cenário desconhecido: ${String(scenario)}`)
    resetDb(scenario)
    return ok({ scenario })
  }),
]

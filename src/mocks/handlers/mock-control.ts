// Rotas de controle da simulação (usadas pela demo e pelos testes E2E). Não fazem parte da API real.
import { http } from 'msw'
import { resetDb } from '../db'
import { connectionCount, disconnectAll, replay, updateNft } from '../realtime'
import { isScenarioName } from '../scenarios'
import { fail, noContent, ok } from './respond'

const DECIMAL = /^\d+(\.\d+)?$/

export const mockControlHandlers = [
  // GET /api/__mock/ping → o worker está interceptando esta aba? (ver reviveIfStopped em browser.ts)
  http.get('/api/__mock/ping', () => ok({ ok: true })),

  // POST /api/__mock/reset { scenario? } → restaura o estado inicial do cenário.
  http.post('/api/__mock/reset', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { scenario?: unknown }
    const scenario = body.scenario ?? 'default'
    if (!isScenarioName(scenario)) return fail('VALIDATION', `Cenário desconhecido: ${String(scenario)}`)
    resetDb(scenario)
    return ok({ scenario })
  }),

  // POST /api/__mock/nft-update { nftId, editionId, price?, available?, silent? }
  // → muda o NFT no banco e emite nft.updated pelo socket (silent: grava sem emitir). Devolve o evento.
  http.post('/api/__mock/nft-update', async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const { nftId, editionId, price, available, silent } = body
    if (typeof nftId !== 'string' || typeof editionId !== 'string')
      return fail('VALIDATION', 'Informe nftId e editionId.')
    if (price !== undefined && !(typeof price === 'string' && DECIMAL.test(price)))
      return fail('VALIDATION', 'price deve ser um decimal em string, ex.: "1.25".')
    if (available !== undefined && !(Number.isInteger(available) && (available as number) >= 0))
      return fail('VALIDATION', 'available deve ser um inteiro >= 0.')
    const event = updateNft(
      { nftId, editionId, price: price as string | undefined, available: available as number | undefined },
      { silent: silent === true },
    )
    return event ? ok(event) : fail('NOT_FOUND', 'NFT ou edição não encontrados.')
  }),

  // POST /api/__mock/replay { eventId } → reenvia um evento já emitido (duplicado ou antigo).
  http.post('/api/__mock/replay', async ({ request }) => {
    const { eventId } = (await request.json().catch(() => ({}))) as { eventId?: unknown }
    const event = typeof eventId === 'string' ? replay(eventId) : undefined
    return event ? ok(event) : fail('NOT_FOUND', 'Evento não encontrado.')
  }),

  // POST /api/__mock/disconnect → derruba as conexões de socket (o cliente reconecta sozinho).
  http.post('/api/__mock/disconnect', () => {
    disconnectAll()
    return noContent()
  }),

  // GET /api/__mock/connections → quantos sockets estão conectados (os testes esperam por isto).
  http.get('/api/__mock/connections', () => ok({ count: connectionCount() })),
]

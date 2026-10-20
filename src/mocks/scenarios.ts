// Cenários da API simulada: uma tabela com nome, descrição e o que muda. Escolha com `?scenario=<nome>`
// na URL, pelo painel de testes ou `POST /api/__mock/reset { scenario }` — trocar de cenário RESETA os
// dados. Tudo é determinístico: o mesmo cenário, com as mesmas ações, dá sempre o mesmo resultado.
//
// - Latência e falhas genéricas (offline, 500, 401, rotas que falham) são aplicadas num lugar só,
//   `applyScenario`, chamado antes de todos os handlers (src/mocks/handlers/index.ts).
// - O que depende de regra de negócio (pagamento recusado, preço que muda no checkout…) é uma flag
//   lida pelo handler daquela rota.
import { delay, HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/api/types'

type FailRule = {
  method: string // 'POST', 'DELETE'… ou '*'
  path: RegExp
  status: number
  body: ApiErrorBody
  /** Só requisições com token (rotas de quem está logado). */
  authenticated?: boolean
  /** Falha só as N primeiras vezes de cada rota; depois funciona (ex.: erro + "Tentar novamente"). */
  times?: number
}

export type Scenario = {
  description: string
  latencyMs?: number // atraso fixo de cada resposta (padrão 250)
  latency?: 'variable' | 'out-of-order' // atrasos que mudam a cada requisição, numa sequência fixa
  offline?: boolean // nenhuma resposta: o app vê falha de rede
  fail?: FailRule[]
  emptyCatalog?: boolean // o banco começa sem NFTs
  changePriceAtCheckout?: boolean // o 1º envio de pedido encontra o preço mudado (409 QUOTE_STALE)
  sellOutAtCheckout?: boolean // o 1º envio de pedido encontra a edição esgotada (409 OUT_OF_STOCK)
  rejectPayment?: boolean // o pedido termina rejected em vez de confirmed
  loseOrderResponse?: boolean // o 1º envio de cada pedido cria o pedido, mas a resposta se perde
}

const unavailable = (message: string): ApiErrorBody => ({ code: 'UNAVAILABLE', message })

export const scenarios = {
  default: { description: 'Tudo funciona, com latência curta (250 ms).' },
  empty: { description: 'Catálogo vazio: estados de "nenhum NFT".', emptyCatalog: true },
  slow: { description: 'Toda resposta demora 2 s: aparecem os skeletons.', latencyMs: 2000 },
  'variable-latency': {
    description: 'Cada resposta leva de 100 ms a 1,5 s, numa sequência fixa (mesma ordem a cada carga).',
    latency: 'variable',
  },
  'out-of-order': {
    description: 'Leituras alternam lenta (1,2 s) e rápida (100 ms): respostas chegam fora de ordem.',
    latency: 'out-of-order',
  },
  offline: { description: 'Sem conexão: nenhuma requisição à API responde.', offline: true },
  'server-error': {
    description: 'Cada rota responde 500 nas 3 primeiras vezes e depois funciona ("Tentar novamente").',
    fail: [
      {
        method: '*',
        path: /^\/api\//,
        status: 500,
        body: unavailable('Erro interno no servidor.'),
        times: 3,
      },
    ],
  },
  unauthorized: {
    description: 'O servidor recusa o token: toda rota de quem está logado responde 401.',
    fail: [
      {
        method: '*',
        path: /^\/api\//,
        status: 401,
        authenticated: true,
        body: { code: 'UNAUTHORIZED', message: 'Entre para continuar.' },
      },
    ],
  },
  'session-expired': {
    description:
      'A sessão vence logo depois do login: a próxima chamada logada responde 401 SESSION_EXPIRED.',
    fail: [
      {
        method: '*',
        path: /^\/api\/(?!auth\/(login|register))/,
        status: 401,
        authenticated: true,
        body: {
          code: 'UNAUTHORIZED',
          reason: 'SESSION_EXPIRED',
          message: 'Sua sessão expirou. Entre novamente.',
        },
      },
    ],
  },
  'register-conflict': {
    description: 'Cadastro sempre responde 409: e-mail já cadastrado (erro no campo).',
    fail: [
      {
        method: 'POST',
        path: /^\/api\/auth\/register$/,
        status: 409,
        body: {
          code: 'CONFLICT',
          reason: 'EMAIL_TAKEN',
          message: 'Este e-mail já está cadastrado.',
          fields: { email: 'Este e-mail já está cadastrado.' },
        },
      },
    ],
  },
  'favorites-fail': {
    description: 'Favoritar e desfavoritar falham: o coração volta ao estado anterior com um aviso.',
    latencyMs: 400,
    fail: [
      {
        method: 'PUT',
        path: /^\/api\/favorites/,
        status: 503,
        body: unavailable('Não foi possível favoritar agora.'),
      },
      {
        method: 'DELETE',
        path: /^\/api\/favorites/,
        status: 503,
        body: unavailable('Não foi possível remover agora.'),
      },
    ],
  },
  'price-change-checkout': {
    description: 'Ao confirmar o 1º pedido, o preço de um item sobe: a revisão mostra a diferença.',
    changePriceAtCheckout: true,
  },
  'sold-out-checkout': {
    description: 'Ao confirmar o 1º pedido, um item esgota: o pedido é recusado e o carrinho avisa.',
    sellOutAtCheckout: true,
  },
  'order-timeout': {
    description:
      'A resposta do pedido se perde (como num timeout); o app reenvia com a mesma chave e recupera.',
    loseOrderResponse: true,
  },
  'payment-rejected': {
    description: 'A rede recusa o pagamento: o pedido termina recusado e os itens ficam no carrinho.',
    rejectPayment: true,
  },
  'wallet-reject': {
    description: 'A carteira recusa a conexão no pagamento.',
    fail: [
      {
        method: 'POST',
        path: /^\/api\/wallets\/[^/]+\/connect$/,
        status: 409,
        body: { code: 'CONFLICT', reason: 'WALLET_REJECTED', message: 'A conexão foi recusada na carteira.' },
      },
    ],
  },
  'wallet-disconnect': {
    description: 'A carteira conecta, mas cai na hora de confirmar o pedido.',
    fail: [
      {
        method: 'POST',
        path: /^\/api\/orders$/,
        status: 409,
        body: {
          code: 'CONFLICT',
          reason: 'WALLET_DISCONNECTED',
          message: 'A carteira desconectou antes de assinar.',
        },
      },
    ],
  },
} satisfies Record<string, Scenario>

export type ScenarioName = keyof typeof scenarios

const SCENARIO_KEY = 'mock-scenario'

export function isScenarioName(value: unknown): value is ScenarioName {
  return typeof value === 'string' && value in scenarios
}

export function getScenarioName(): ScenarioName {
  const saved = localStorage.getItem(SCENARIO_KEY)
  return isScenarioName(saved) ? saved : 'default'
}

export function setScenarioName(name: ScenarioName) {
  localStorage.setItem(SCENARIO_KEY, name)
  resetScenarioState()
}

export function getScenario(): Scenario {
  return scenarios[getScenarioName()]
}

// --- Estado da execução (na memória da aba; recomeça a cada carga e a cada reset) -------------------

let requestCount = 0
const failCounts = new Map<string, number>()
const usedOnce = new Set<string>()

function resetScenarioState() {
  requestCount = 0
  failCounts.clear()
  usedOnce.clear()
}

/** true só na 1ª vez que `key` é pedida (ex.: "a 1ª resposta deste pedido se perde"). */
export function firstTime(key: string) {
  if (usedOnce.has(key)) return false
  usedOnce.add(key)
  return true
}

/** Sequência fixa entre 100 e 1500 ms (gerador pseudoaleatório com semente constante). */
function variableLatency(n: number) {
  let t = (n + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const random = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return Math.round(100 + random * 1400)
}

function latencyOf(scenario: Scenario, request: Request, n: number) {
  if (scenario.latency === 'variable') return variableLatency(n)
  // Leituras alternam lenta/rápida: a 2ª pedida responde antes da 1ª.
  if (scenario.latency === 'out-of-order' && request.method === 'GET') return n % 2 === 0 ? 1200 : 100
  return scenario.latencyMs ?? 250
}

/**
 * Aplicado antes de todo handler da API: espera a latência do cenário e, se for o caso, devolve a
 * falha. Devolver `undefined` deixa a requisição seguir para o handler normal.
 */
export async function applyScenario(request: Request): Promise<Response | undefined> {
  const scenario = getScenario()
  const n = requestCount++
  await delay(latencyOf(scenario, request, n))
  if (scenario.offline) return HttpResponse.error()

  const path = new URL(request.url).pathname
  for (const rule of scenario.fail ?? []) {
    if (rule.method !== '*' && rule.method !== request.method) continue
    if (!rule.path.test(path)) continue
    if (rule.authenticated && !request.headers.has('Authorization')) continue
    if (rule.times !== undefined) {
      const key = `${request.method} ${path}`
      const count = failCounts.get(key) ?? 0
      if (count >= rule.times) continue
      failCounts.set(key, count + 1)
    }
    return HttpResponse.json(rule.body, { status: rule.status })
  }
  return undefined
}

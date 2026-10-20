// Cenários de rede/dados da API simulada. Escolha com `?scenario=<nome>` na URL (fica salvo)
// ou pelo `POST /api/__mock/reset { scenario }`. Os demais cenários entram no passo 15.
export type Scenario = {
  description: string
  latencyMs: number // atraso de toda resposta
  failFavorites?: boolean // favoritar/desfavoritar responde 503 (demonstra o rollback otimista)
  rejectWallet?: boolean // "Conectar carteira" é recusado (409 WALLET_REJECTED)
  disconnectWallet?: boolean // o pedido falha porque a carteira caiu (409 WALLET_DISCONNECTED)
  rejectPayment?: boolean // o pedido termina rejected em vez de confirmed
  loseOrderResponse?: boolean // o 1º envio de cada pedido cria o pedido, mas a resposta se perde
}

export const scenarios = {
  default: { description: 'Tudo funciona, com latência curta.', latencyMs: 250 },
  'favorites-fail': {
    description: 'Favoritar e desfavoritar falham: o coração volta ao estado anterior com um aviso.',
    latencyMs: 400,
    failFavorites: true,
  },
  'wallet-reject': {
    description: 'A carteira recusa a conexão no pagamento.',
    latencyMs: 250,
    rejectWallet: true,
  },
  'wallet-disconnect': {
    description: 'A carteira conecta, mas cai na hora de confirmar o pedido.',
    latencyMs: 250,
    disconnectWallet: true,
  },
  'payment-rejected': {
    description: 'A rede recusa o pagamento: o pedido termina recusado e os itens ficam no carrinho.',
    latencyMs: 250,
    rejectPayment: true,
  },
  'order-timeout': {
    description:
      'A resposta do pedido se perde (como num timeout); o app reenvia com a mesma chave e recupera o pedido.',
    latencyMs: 250,
    loseOrderResponse: true,
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
}

export function getScenario(): Scenario {
  return scenarios[getScenarioName()]
}

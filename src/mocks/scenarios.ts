// Cenários de rede/dados da API simulada. Escolha com `?scenario=<nome>` na URL (fica salvo)
// ou pelo `POST /api/__mock/reset { scenario }`. Os demais cenários entram no passo 15.
export type Scenario = {
  description: string
  latencyMs: number // atraso de toda resposta
}

export const scenarios = {
  default: { description: 'Tudo funciona, com latência curta.', latencyMs: 250 },
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

// Validação dos parâmetros da URL (validateSearch das rotas) com funções simples, sem biblioteca:
// as rotas fazem parte do carregamento inicial, e assim o zod fica só nos formulários (sob demanda).
// Valor ausente ou inválido vira `undefined` (e a rota aplica o padrão): a URL nunca quebra a tela.

/** Um dos valores aceitos. */
export function oneOf<T extends string>(value: unknown, options: readonly T[]): T | undefined {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
    ? (value as T)
    : undefined
}

/** Texto. O router lê "?q=123" como número: aqui ele volta a ser texto. */
export function text(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return undefined
}

/** Decimal em texto ("1.25"), como os valores em ETH. */
export function decimal(value: unknown): string | undefined {
  const raw = text(value)
  return raw !== undefined && /^\d+(\.\d+)?$/.test(raw) ? raw : undefined
}

/** Inteiro a partir de 1 (página). */
export function positiveInt(value: unknown): number | undefined {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 ? n : undefined
}

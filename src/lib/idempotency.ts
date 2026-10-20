// Chave de idempotência do pedido: UMA por tentativa de compra.
// - Mesmo conteúdo (cotação, carteira, rede, comprador) → a mesma chave. Cliques repetidos ou um
//   reenvio depois de falha de rede chegam ao servidor como o mesmo pedido, nunca dois.
// - Conteúdo diferente → chave nova (é outra compra).
// Fica no sessionStorage: sobrevive ao refresh da aba e some quando ela fecha.
const STORAGE_KEY = 'order-idempotency'

type Saved = { fingerprint: string; key: string }

function read(): Saved | null {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as Saved | null
  } catch {
    return null
  }
}

export function idempotencyKeyFor(content: unknown): string {
  const fingerprint = JSON.stringify(content)
  const saved = read()
  if (saved?.fingerprint === fingerprint) return saved.key
  const key = crypto.randomUUID()
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint, key } satisfies Saved))
  return key
}

/** Depois que o pedido foi criado: a próxima compra (mesmo que igual) é outra tentativa. */
export function clearIdempotencyKey() {
  sessionStorage.removeItem(STORAGE_KEY)
}

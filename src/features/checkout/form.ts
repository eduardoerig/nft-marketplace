import { z } from 'zod'
import { NETWORKS, type Profile, type Wallet } from '@/api/types'

// As mesmas regras da API (src/mocks/handlers/orders.ts).
export const checkoutSchema = z.object({
  displayName: z.string().trim().min(2, 'Use de 2 a 40 caracteres.').max(40, 'Use de 2 a 40 caracteres.'),
  username: z.string().regex(/^[a-z0-9_.]{3,20}$/i, 'Use de 3 a 20 letras, números, "." ou "_".'),
  email: z.email('Informe um e-mail válido.'),
  walletId: z.string().min(1, 'Escolha uma carteira.'),
  network: z.string().pipe(z.enum(NETWORKS, 'Selecione uma rede.')),
  note: z.string().max(280, 'Use até 280 caracteres.'),
})
export type CheckoutValues = z.input<typeof checkoutSchema>
export const CHECKOUT_FIELDS = ['displayName', 'username', 'email', 'walletId', 'network', 'note'] as const

// Rascunho do formulário no sessionStorage: se a sessão expirar no meio do pagamento, a pessoa
// entra de novo e volta para /checkout com tudo que tinha digitado.
const DRAFT_KEY = 'checkout-draft'

export function loadDraft(): Partial<CheckoutValues> {
  try {
    return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Partial<CheckoutValues>
  } catch {
    return {}
  }
}

export function saveDraft(values: Partial<CheckoutValues>) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values))
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY)
}

/** Valores iniciais: o rascunho, se houver; senão o perfil e a carteira principal. */
export function initialValues(profile: Profile, wallets: Wallet[]): CheckoutValues {
  const primary = wallets.find((w) => w.kind === 'primary') ?? wallets[0]
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    walletId: primary?.id ?? '',
    network: primary?.network ?? '',
    note: '',
    ...loadDraft(),
  }
}

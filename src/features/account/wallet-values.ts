import { z } from 'zod'
import { NETWORKS, type Wallet, type WalletInput, type WalletProvider } from '@/api/types'

export const PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  walletconnect: 'WalletConnect',
  coinbase: 'Coinbase Wallet',
}

// As mesmas regras da API (src/mocks/handlers/wallets.ts). Rede e tipo chegam do <select> como
// texto ("" = "Selecione…"); o pipe valida e devolve o tipo certo.
export const walletSchema = z.object({
  label: z.string().trim().min(1, 'Informe um apelido.').max(30, 'Use até 30 caracteres.'),
  network: z.string().pipe(z.enum(NETWORKS, 'Selecione uma rede.')),
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Use "0x" seguido de 40 caracteres hexadecimais.'),
  provider: z
    .string()
    .pipe(z.enum(['metamask', 'walletconnect', 'coinbase'], 'Selecione o tipo de carteira.')),
  ensName: z.string().regex(/^([a-z0-9][a-z0-9.-]{1,38})?$/, 'Use letras minúsculas, números, "." ou "-".'),
})
export type WalletFormValues = z.input<typeof walletSchema>
export const WALLET_FIELDS = ['label', 'network', 'address', 'provider', 'ensName'] as const

/** Valores iniciais do formulário: da carteira editada (ou copiada). O ".eth" fica fora do campo. */
export function walletValues(wallet: Partial<Wallet> = {}): WalletFormValues {
  return {
    label: wallet.label ?? '',
    network: wallet.network ?? '',
    address: wallet.address ?? '',
    provider: wallet.provider ?? '',
    ensName: wallet.ensName?.replace(/\.eth$/, '') ?? '',
  }
}

export function toWalletInput(kind: Wallet['kind'], values: z.output<typeof walletSchema>): WalletInput {
  return { kind, ...values, ensName: values.ensName ? `${values.ensName}.eth` : null }
}

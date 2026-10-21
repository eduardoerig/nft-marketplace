import { z } from 'zod'
import { NETWORKS, type Profile, type Wallet, type WalletInput, type WalletProvider } from '@/api/types'

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
  // Obrigatório, como no Figma. O ".eth" fica fora do campo (a caixa ao lado).
  ensName: z
    .string()
    .min(1, 'Informe o nome ENS.')
    .regex(/^[a-z0-9][a-z0-9.-]{1,38}$/, 'Use letras minúsculas, números, "." ou "-".'),
  // Dados do titular (as mesmas regras do perfil).
  displayName: z.string().trim().min(2, 'Use de 2 a 40 caracteres.').max(40, 'Use de 2 a 40 caracteres.'),
  profileName: z.string().regex(/^[a-z0-9_.]{3,20}$/i, 'Use de 3 a 20 letras, números, "." ou "_".'),
  email: z.email('Informe um e-mail válido.'),
  secondaryAddress: z
    .string()
    .trim()
    .regex(/^(0x[0-9a-fA-F]{40}|[a-z0-9][a-z0-9.-]{1,38}\.eth)?$/, 'Use um nome .eth ou um endereço 0x.'),
  referralCode: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{4,20}$/i, 'Use de 4 a 20 letras, números ou "-".'),
})
export type WalletFormValues = z.input<typeof walletSchema>
export const WALLET_FIELDS = [
  'label',
  'network',
  'address',
  'provider',
  'ensName',
  'displayName',
  'profileName',
  'email',
  'secondaryAddress',
  'referralCode',
] as const

/**
 * Valores iniciais do formulário: da carteira editada (ou copiada). O ".eth" fica fora do campo.
 * Carteira nova: nome, perfil e e-mail já vêm do perfil da conta (a pessoa pode trocar).
 */
export function walletValues(wallet: Partial<Wallet> = {}, profile?: Profile): WalletFormValues {
  return {
    label: wallet.label ?? '',
    network: wallet.network ?? '',
    address: wallet.address ?? '',
    provider: wallet.provider ?? '',
    ensName: wallet.ensName?.replace(/\.eth$/, '') ?? '',
    displayName: wallet.displayName ?? profile?.displayName ?? '',
    profileName: wallet.profileName ?? profile?.username ?? '',
    email: wallet.email ?? profile?.email ?? '',
    secondaryAddress: wallet.secondaryAddress ?? '',
    referralCode: wallet.referralCode ?? '',
  }
}

export function toWalletInput(kind: Wallet['kind'], values: z.output<typeof walletSchema>): WalletInput {
  return {
    kind,
    ...values,
    ensName: `${values.ensName}.eth`,
    secondaryAddress: values.secondaryAddress || null,
    referralCode: values.referralCode.toUpperCase(),
  }
}

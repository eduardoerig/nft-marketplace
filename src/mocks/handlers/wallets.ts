// /api/wallets* — carteiras principal e secundária do usuário logado.
import { http } from 'msw'
import { NETWORKS, type Wallet, type WalletInput, type WalletUpdate } from '@/api/types'
import { readDb, updateDb } from '../db'
import type { MockWallet } from '../fixtures/users'
import { EMAIL, requireUser, USERNAME } from './auth'
import { fail, ok } from './respond'

const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const ENS = /^[a-z0-9][a-z0-9.-]{1,38}\.eth$/ // ex.: "nova.kurio.eth"
const PROVIDERS = ['metamask', 'walletconnect', 'coinbase']
const REFERRAL = /^[A-Z0-9-]{4,20}$/i // código de indicação, ex.: "KURIO-ANA"

/** A carteira como a API mostra: sem o dono (userId). */
function toWallet(wallet: MockWallet): Wallet {
  const { id, kind, label, address, network, provider, ensName } = wallet
  const { displayName, profileName, email, secondaryAddress, referralCode } = wallet
  return {
    id,
    kind,
    label,
    address,
    network,
    provider,
    ensName,
    displayName,
    profileName,
    email,
    secondaryAddress,
    referralCode,
  }
}

function validateWallet(input: WalletUpdate & { kind?: unknown }, creating: boolean) {
  const fields: Record<string, string> = {}
  if (creating && input.kind !== 'primary' && input.kind !== 'secondary') fields.kind = 'Tipo inválido.'
  if ((creating || input.label !== undefined) && !/^.{1,30}$/.test(input.label?.trim() ?? '')) {
    fields.label = 'Informe um apelido de até 30 caracteres.'
  }
  if ((creating || input.address !== undefined) && !ADDRESS.test(input.address ?? '')) {
    fields.address = 'Use "0x" seguido de 40 caracteres hexadecimais.'
  }
  if ((creating || input.network !== undefined) && !NETWORKS.includes(input.network!)) {
    fields.network = 'Selecione uma rede.'
  }
  if ((creating || input.provider !== undefined) && !PROVIDERS.includes(input.provider!)) {
    fields.provider = 'Selecione o tipo de carteira.'
  }
  if ((creating || input.ensName !== undefined) && !ENS.test(input.ensName ?? '')) {
    fields.ensName = 'Use um nome terminado em ".eth".'
  }
  // Dados do titular: as mesmas regras do perfil.
  if ((creating || input.displayName !== undefined) && !/^.{2,40}$/.test(input.displayName?.trim() ?? '')) {
    fields.displayName = 'Use de 2 a 40 caracteres.'
  }
  if ((creating || input.profileName !== undefined) && !USERNAME.test(input.profileName ?? '')) {
    fields.profileName = 'Use de 3 a 20 letras, números, "." ou "_".'
  }
  if ((creating || input.email !== undefined) && !EMAIL.test(input.email ?? '')) {
    fields.email = 'Informe um e-mail válido.'
  }
  // "ENS ou carteira secundária": um nome .eth ou outro endereço 0x.
  const secondary = input.secondaryAddress
  if (secondary && !ENS.test(secondary) && !ADDRESS.test(secondary)) {
    fields.secondaryAddress = 'Use um nome .eth ou um endereço 0x.'
  }
  if ((creating || input.referralCode !== undefined) && !REFERRAL.test(input.referralCode ?? '')) {
    fields.referralCode = 'Use de 4 a 20 letras, números ou "-".'
  }
  return fields
}

export const walletHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    const db = readDb()
    const user = requireUser(db, request)
    if (user instanceof Response) return user
    return ok(db.wallets.filter((w) => w.userId === user.id).map(toWallet))
  }),

  http.post('/api/wallets', async ({ request }) => {
    const input = (await request.json().catch(() => ({}))) as Partial<WalletInput>
    const fields = validateWallet(input, true)
    if (Object.keys(fields).length > 0) return fail('VALIDATION', 'Confira os campos.', { fields })

    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      if (db.wallets.some((w) => w.userId === user.id && w.kind === input.kind)) {
        return fail('CONFLICT', 'Você já tem uma carteira desse tipo.')
      }
      const wallet: MockWallet = {
        id: `wallet-${crypto.randomUUID()}`,
        userId: user.id,
        kind: input.kind!,
        label: input.label!.trim(),
        address: input.address!,
        network: input.network!,
        provider: input.provider!,
        ensName: input.ensName!,
        displayName: input.displayName!.trim(),
        profileName: input.profileName!,
        email: input.email!,
        secondaryAddress: input.secondaryAddress || null,
        referralCode: input.referralCode!.toUpperCase(),
      }
      db.wallets.push(wallet)
      return ok(toWallet(wallet), 201)
    })
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    const input = (await request.json().catch(() => ({}))) as WalletUpdate
    const fields = validateWallet(input, false)
    if (Object.keys(fields).length > 0) return fail('VALIDATION', 'Confira os campos.', { fields })

    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      const wallet = db.wallets.find((w) => w.id === params.id)
      if (!wallet) return fail('NOT_FOUND', 'Carteira não encontrada.')
      if (wallet.userId !== user.id) return fail('FORBIDDEN', 'Esta carteira não é sua.')
      // Só os campos editáveis: id, dono e tipo (principal/secundária) nunca mudam.
      Object.assign(wallet, {
        ...(input.label !== undefined && { label: input.label.trim() }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.network !== undefined && { network: input.network }),
        ...(input.provider !== undefined && { provider: input.provider }),
        ...(input.ensName !== undefined && { ensName: input.ensName }),
        ...(input.displayName !== undefined && { displayName: input.displayName.trim() }),
        ...(input.profileName !== undefined && { profileName: input.profileName }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.secondaryAddress !== undefined && { secondaryAddress: input.secondaryAddress || null }),
        ...(input.referralCode !== undefined && { referralCode: input.referralCode.toUpperCase() }),
      })
      return ok(toWallet(wallet))
    })
  }),

  // "Conectar carteira" (simulado). A recusa (cenário wallet-reject) é uma regra em scenarios.ts.
  http.post('/api/wallets/:id/connect', async ({ request, params }) => {
    const { provider } = (await request.json().catch(() => ({}))) as { provider?: string }
    if (!PROVIDERS.includes(provider ?? '')) {
      return fail('VALIDATION', 'Escolha a carteira.', { fields: { provider: 'Escolha a carteira.' } })
    }
    const db = readDb()
    const user = requireUser(db, request)
    if (user instanceof Response) return user
    const wallet = db.wallets.find((w) => w.id === params.id)
    if (!wallet) return fail('NOT_FOUND', 'Carteira não encontrada.')
    if (wallet.userId !== user.id) return fail('FORBIDDEN', 'Esta carteira não é sua.')
    return ok({ walletId: wallet.id, provider, address: wallet.address })
  }),
]

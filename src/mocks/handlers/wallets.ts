// /api/wallets* — carteiras principal e secundária do usuário logado.
import { http } from 'msw'
import { NETWORKS, type Wallet, type WalletInput, type WalletUpdate } from '@/api/types'
import { readDb, updateDb } from '../db'
import type { MockWallet } from '../fixtures/users'
import { requireUser } from './auth'
import { fail, ok } from './respond'

const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const ENS = /^[a-z0-9][a-z0-9.-]{1,38}\.eth$/ // ex.: "nova.kurio.eth"
const PROVIDERS = ['metamask', 'walletconnect', 'coinbase']

function toWallet({ id, kind, label, address, network, provider, ensName }: MockWallet): Wallet {
  return { id, kind, label, address, network, provider, ensName }
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
  if (input.ensName && !ENS.test(input.ensName)) fields.ensName = 'Use um nome terminado em ".eth".'
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
        ensName: input.ensName || null,
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
        ...(input.ensName !== undefined && { ensName: input.ensName || null }),
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

// Dois usuários fictícios. Senha de ambos: Senha@123 — guardada SÓ como hash
// SHA-256 de `${salt}:${senha}` (o texto puro nunca entra no banco simulado).
import type { Wallet } from '@/api/types'

export type MockUser = {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  ensName: string | null
  walletNickname: string | null
  passwordSalt: string
  passwordHash: string
}

export type MockWallet = Wallet & { userId: string }

export const userFixtures: MockUser[] = [
  {
    id: 'user-ana',
    username: 'ana',
    displayName: 'Ana Souza',
    email: 'ana@example.com',
    avatarUrl: null,
    ensName: 'ana',
    walletNickname: 'Principal',
    passwordSalt: 's4lt-ana-7f3c',
    passwordHash: '541f03a516b789cadcf54aff274fab2f7de071c1052a7acd35eb917308db1f19',
  },
  {
    id: 'user-bruno',
    username: 'bruno',
    displayName: 'Bruno Lima',
    email: 'bruno@example.com',
    avatarUrl: null,
    ensName: null,
    walletNickname: null,
    passwordSalt: 's4lt-bruno-2b91',
    passwordHash: 'd35449078a0f68e248e0bad09d06a484fd0cf2fa2825d07fcbb493facf81139d',
  },
]

// Ana tem carteira principal e secundária (como no pagamento mobile do Figma); Bruno só a principal.
export const walletFixtures: MockWallet[] = [
  {
    id: 'wallet-ana-1',
    userId: 'user-ana',
    kind: 'primary',
    label: 'Principal',
    address: '0xA91F3c2B7d4E5f60718293A4b5C6d7E8f9A0E82C',
    network: 'ethereum',
    provider: 'metamask',
    ensName: null,
  },
  {
    id: 'wallet-ana-2',
    userId: 'user-ana',
    kind: 'secondary',
    label: 'Reserva',
    address: '0x5B2e8D1c4A7f9036E2b1C8d4F7a3E6b9C0d1F2A3',
    network: 'polygon',
    provider: 'coinbase',
    ensName: 'nova.kurio.eth',
  },
  {
    id: 'wallet-bruno-1',
    userId: 'user-bruno',
    kind: 'primary',
    label: 'Principal',
    address: '0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d',
    network: 'ethereum',
    provider: 'walletconnect',
    ensName: null,
  },
]

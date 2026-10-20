// "Banco de dados" da API simulada: um objeto salvo em localStorage['mock-db'].
// Cada requisição lê o estado atual e grava o novo — por isso o estado sobrevive ao refresh
// e fica coerente entre abas. `resetDb` restaura as fixtures (estado conhecido).
import type { Order } from '@/api/types'
import { couponFixtures, type MockCoupon } from './fixtures/coupons'
import { nftFixtures } from './fixtures/nfts'
import { userFixtures, walletFixtures, type MockUser, type MockWallet } from './fixtures/users'
import { setScenarioName, type ScenarioName } from './scenarios'

const DB_KEY = 'mock-db'
const SCHEMA_VERSION = 2 // aumente quando o formato mudar: estados antigos são descartados

export type MockSession = { token: string; userId: string; expiresAt: string }

export type MockCartLine = { id: string; nftId: string; editionId: string; quantity: number }
export type MockCart = {
  id: string
  userId: string | null
  items: MockCartLine[]
  lastQuote?: { id: string; version: number } // última cotação emitida (a versão sobe quando muda)
}

export type MockOrder = Order & { userId: string; idempotencyKey: string; requestHash: string }

export type Db = {
  schemaVersion: number
  scenario: ScenarioName
  users: MockUser[]
  sessions: MockSession[]
  nfts: typeof nftFixtures
  carts: MockCart[]
  favorites: Record<string, string[]> // userId → ids de NFT
  wallets: MockWallet[]
  coupons: MockCoupon[]
  orders: MockOrder[]
}

function seed(scenario: ScenarioName): Db {
  return structuredClone({
    schemaVersion: SCHEMA_VERSION,
    scenario,
    users: userFixtures,
    sessions: [],
    nfts: nftFixtures,
    carts: [],
    favorites: {},
    wallets: walletFixtures,
    coupons: couponFixtures,
    orders: [],
  })
}

export function readDb(): Db {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) {
    const db = JSON.parse(raw) as Db
    if (db.schemaVersion === SCHEMA_VERSION) return db
  }
  const fresh = seed('default')
  writeDb(fresh)
  return fresh
}

export function writeDb(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

/** Lê, altera e grava numa tacada só. */
export function updateDb<T>(change: (db: Db) => T): T {
  const db = readDb()
  const result = change(db)
  writeDb(db)
  return result
}

/** Volta ao estado inicial do cenário (apaga sessões, carrinhos, pedidos e alterações). */
export function resetDb(scenario: ScenarioName = 'default') {
  setScenarioName(scenario)
  writeDb(seed(scenario))
}

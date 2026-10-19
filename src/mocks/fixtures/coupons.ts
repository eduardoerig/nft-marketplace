// Cupons do cenário padrão.
export type MockCoupon = { code: string; percent: number; expiresAt: string }

export const couponFixtures: MockCoupon[] = [
  { code: 'DESCONTO10', percent: 10, expiresAt: '2099-12-31T23:59:59.000Z' }, // válido
  { code: 'EXPIRADO', percent: 15, expiresAt: '2020-01-01T00:00:00.000Z' }, // expirado
]

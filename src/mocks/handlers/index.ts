import { authHandlers } from './auth'
import { mockControlHandlers } from './mock-control'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'
import { walletHandlers } from './wallets'

export const handlers = [
  ...mockControlHandlers,
  ...authHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...nftHandlers,
]

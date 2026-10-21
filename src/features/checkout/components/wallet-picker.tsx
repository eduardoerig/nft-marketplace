import type { UseFormRegisterReturn } from 'react-hook-form'
import { Link } from '@tanstack/react-router'
import type { Wallet } from '@/api/types'
import { NETWORK_LABELS } from '@/features/catalog/search'

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

type Props = {
  wallets: Wallet[]
  field: UseFormRegisterReturn<'walletId'>
  error?: string
}

/**
 * "Carteira conectada" (frame mobile do pagamento): as carteiras cadastradas como cartões de opção.
 * Para cadastrar ou trocar, "Trocar carteira" leva às carteiras da conta.
 */
export function WalletPicker({ wallets, field, error }: Props) {
  return (
    <fieldset
      aria-describedby={error ? 'carteira-erro' : undefined}
      aria-invalid={Boolean(error)}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-4">
        <legend className="float-left text-[15px] font-bold md:font-normal">
          Carteira conectada
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        </legend>
        <Link to="/account/wallets" className="text-sm font-bold text-highlight hover:underline">
          Trocar carteira
        </Link>
      </div>
      {wallets.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Você ainda não tem carteira cadastrada. Use "Trocar carteira" para adicionar uma.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {wallets.map((wallet) => (
          <label
            key={wallet.id}
            className="flex cursor-pointer items-start gap-4 rounded-[10px] border border-input bg-card p-4 has-checked:border-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input type="radio" value={wallet.id} {...field} className="mt-1 size-4 accent-primary" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-bold">{wallet.label}</span>
              <span className="truncate text-sm text-placeholder">
                {wallet.ensName} · {shortAddress(wallet.address)}
              </span>
              <span className="text-sm text-placeholder">Rede {NETWORK_LABELS[wallet.network]}</span>
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id="carteira-erro" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  )
}

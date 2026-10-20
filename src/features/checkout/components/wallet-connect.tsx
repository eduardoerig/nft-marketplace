import type { Ref } from 'react'
import { CheckCircle2Icon } from 'lucide-react'
import type { WalletProvider } from '@/api/types'
import { Button } from '@/components/ui/button'
import { PROVIDER_LABELS } from '@/features/account/wallet-values'

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'rejected' | 'disconnected'

const PROVIDERS: { id: WalletProvider; badge: string }[] = [
  { id: 'walletconnect', badge: 'W' },
  { id: 'metamask', badge: 'M' },
  { id: 'coinbase', badge: 'C' },
]

const MESSAGES: Record<ConnectionStatus, string> = {
  idle: 'Conecte a carteira para confirmar a compra.',
  connecting: 'Conectando… confirme na sua carteira.',
  connected: 'Carteira conectada',
  rejected: 'A conexão foi recusada na carteira.',
  disconnected: 'A carteira desconectou. Conecte de novo para continuar.',
}

type Props = {
  provider: WalletProvider
  onProviderChange: (provider: WalletProvider) => void
  status: ConnectionStatus
  address?: string
  onConnect: () => void
  onDisconnect: () => void
  /** Para levar o foco ao botão quando a pessoa tenta confirmar sem conectar. */
  connectButtonRef?: Ref<HTMLButtonElement>
}

/**
 * "Carteira e rede": por qual app conectar e o botão "Conectar carteira" (simulado pela API).
 * Estados: conectando, conectada, recusada (cenário wallet-reject) e desconectada.
 * O texto do estado fica numa região aria-live: o leitor de tela ouve cada mudança.
 */
export function WalletConnect({
  provider,
  onProviderChange,
  status,
  address,
  onConnect,
  onDisconnect,
  connectButtonRef,
}: Props) {
  const short = address && `${address.slice(0, 6)}…${address.slice(-4)}`
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 w-full text-[17px]/4 font-bold md:text-center">Carteira e rede</legend>
      {PROVIDERS.map(({ id, badge }) => (
        <label
          key={id}
          className="flex h-[52px] cursor-pointer items-center gap-4 rounded-[10px] border border-input bg-card px-4 has-checked:border-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring md:h-[45px] md:rounded-none md:bg-transparent"
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full border border-input text-sm font-bold text-highlight md:hidden"
          >
            {badge}
          </span>
          <span className="flex-1 text-[15px]">{PROVIDER_LABELS[id]}</span>
          <input
            type="radio"
            name="provedor"
            value={id}
            checked={provider === id}
            onChange={() => onProviderChange(id)}
            className="size-4 accent-primary"
          />
        </label>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p
          role="status"
          className={
            status === 'rejected' || status === 'disconnected'
              ? 'text-sm text-destructive'
              : 'text-sm text-muted-foreground'
          }
        >
          {status === 'connected' ? (
            <span className="flex items-center gap-2 text-foreground">
              <CheckCircle2Icon aria-hidden="true" className="size-4 text-highlight" />
              {MESSAGES.connected}: {short}
            </span>
          ) : (
            MESSAGES[status]
          )}
        </p>
        {status === 'connected' ? (
          <Button type="button" variant="link" className="h-auto p-0 text-highlight" onClick={onDisconnect}>
            Desconectar
          </Button>
        ) : (
          <Button
            ref={connectButtonRef}
            type="button"
            variant="outline"
            onClick={onConnect}
            disabled={status === 'connecting'}
          >
            {status === 'connecting'
              ? 'Conectando…'
              : status === 'rejected'
                ? 'Tentar novamente'
                : `Conectar ${PROVIDER_LABELS[provider]}`}
          </Button>
        )}
      </div>
    </fieldset>
  )
}

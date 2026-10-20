import { useState } from 'react'
import type { Wallet } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { walletValues } from '../wallet-values'
import { WalletForm } from './wallet-form'

const COPY = {
  primary: {
    title: 'Carteira principal',
    description: 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.',
    empty: 'Você ainda não adicionou uma carteira principal.',
  },
  secondary: {
    title: 'Carteira secundária',
    description: null,
    empty: 'Você ainda não adicionou uma carteira secundária.',
  },
}

type Props = {
  kind: Wallet['kind']
  wallet?: Wallet
  /** Só na secundária: a principal, para "Igual à carteira principal". */
  primary?: Wallet
}

/**
 * Uma carteira (principal ou secundária). Existe → formulário de edição já preenchido.
 * Não existe → estado vazio do Figma + "Adicionar" (abre o formulário de cadastro).
 */
export function WalletSection({ kind, wallet, primary }: Props) {
  const copy = COPY[kind]
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const titleId = `carteira-${kind}-titulo`

  // "Igual à carteira principal" copia rede, endereço, tipo e ENS — o apelido continua próprio.
  const defaults = walletValues(wallet ?? (sameAsPrimary && primary ? { ...primary, label: '' } : {}))

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="text-lg/5 font-bold">
            {copy.title}
          </h2>
          {copy.description && <p className="text-[13px] text-muted-foreground">{copy.description}</p>}
          {!wallet && !adding && <p className="text-[13px] text-muted-foreground">{copy.empty}</p>}
        </div>
        {!wallet && (
          <div className="flex items-center gap-4">
            {primary && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="igual-principal"
                  checked={sameAsPrimary}
                  onCheckedChange={(checked) => {
                    setSameAsPrimary(checked === true)
                    if (checked === true) setAdding(true)
                  }}
                  className="rounded-full"
                />
                <Label htmlFor="igual-principal" className="text-[13px] font-normal">
                  Igual à carteira principal
                </Label>
              </div>
            )}
            {!adding && (
              <Button
                type="button"
                variant="link"
                onClick={() => setAdding(true)}
                className="h-auto p-0 text-base font-bold text-highlight"
                aria-label={`Adicionar ${copy.title.toLowerCase()}`}
              >
                Adicionar
              </Button>
            )}
          </div>
        )}
      </div>

      {(wallet || adding) && (
        <WalletForm
          // key: trocar "Igual à principal" recomeça o formulário com os novos valores.
          key={`${wallet?.id ?? 'nova'}-${sameAsPrimary}`}
          kind={kind}
          wallet={wallet}
          defaultValues={defaults}
          onSaved={() => setAdding(false)}
        />
      )}
    </section>
  )
}

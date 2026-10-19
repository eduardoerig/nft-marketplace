import { useId } from 'react'
import type { NftEdition } from '@/api/types'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

type Props = {
  editions: NftEdition[]
  value: string
  onChange: (editionId: string) => void
}

// Pílulas "1/1 · 1/10 · 1/50 · ABERTA" como radio group nativo (setas do teclado de graça).
// Edição esgotada fica desabilitada e diz "Esgotada" por escrito — não só pela cor.
export function EditionPicker({ editions, value, onChange }: Props) {
  const name = useId()

  return (
    <fieldset className="flex flex-col gap-2 md:gap-3">
      <legend className="mb-2 text-[15px]/4 font-bold md:mb-3">Edição:</legend>
      <div className="flex flex-wrap gap-1.5 md:gap-1.5">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const checked = edition.id === value
          return (
            <label
              key={edition.id}
              className={cn(
                'relative flex h-7 items-center rounded-full border px-2 text-sm uppercase',
                'has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                checked ? 'border-primary font-medium text-highlight' : 'text-muted-foreground',
                soldOut
                  ? 'cursor-not-allowed border-dashed opacity-60'
                  : 'cursor-pointer hover:border-primary',
              )}
            >
              <input
                type="radio"
                name={name}
                value={edition.id}
                checked={checked}
                disabled={soldOut}
                onChange={() => onChange(edition.id)}
                className="sr-only"
              />
              {edition.name}
              {soldOut && <span className="ml-1 text-xs normal-case">· Esgotada</span>}
              <span className="sr-only">, {formatEth(edition.price)}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

import { MinusIcon, PlusIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  max: number // já é o menor entre disponibilidade e limite por pedido
  onChange: (value: number) => void
  label?: string // nome do item, para o leitor de tela ("Quantidade de Emerald Ape #042")
  size?: 'lg' | 'sm' // lg: detalhe desktop; sm: mobile e carrinho
  disabled?: boolean
}

// Botões − / + do Figma (pílulas laranja) com o número no meio. Quantidade sempre inteira, ≥ 1.
export function QuantityStepper({ value, max, onChange, label, size = 'lg', disabled }: Props) {
  const button = cn(
    'flex items-center justify-center rounded-full border border-background bg-primary text-primary-foreground shadow-soft disabled:cursor-not-allowed disabled:opacity-40',
    size === 'lg' ? 'h-[50px] w-[33px]' : 'h-[30px] w-5',
  )
  const icon = size === 'lg' ? 'size-5' : 'size-3.5'

  return (
    <div
      role="group"
      aria-label={label ? `Quantidade de ${label}` : 'Quantidade'}
      className="flex items-center gap-3"
    >
      <button
        type="button"
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Diminuir quantidade"
      >
        <MinusIcon className={icon} strokeWidth={3} />
      </button>
      <output
        aria-live="polite"
        className={cn('min-w-[2ch] text-center', size === 'lg' ? 'text-xl' : 'text-lg font-medium')}
      >
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Aumentar quantidade"
      >
        <PlusIcon className={icon} strokeWidth={3} />
      </button>
    </div>
  )
}

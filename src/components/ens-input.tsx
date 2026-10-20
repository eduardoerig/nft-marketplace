import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Campo "Nome ENS" do Figma: a caixa ".eth" à esquerda + o nome. Só existe o domínio .eth,
// então a caixa é informativa (não é um select de verdade).
export function EnsInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <div className="flex gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-10 w-20 shrink-0 items-center rounded-sm border border-input px-3 text-sm"
      >
        .eth
      </span>
      <Input className={cn('flex-1', className)} {...props} />
    </div>
  )
}

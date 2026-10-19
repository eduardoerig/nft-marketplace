import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  children: ReactNode
  className?: string
}

// Itens fora do escopo do desafio (editorial, suporte, redes…): continuam visíveis como no Figma,
// mas desabilitados e com o aviso "Em breve" — nunca simulam sucesso.
export function ComingSoon({ children, className }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="link"
          aria-disabled="true"
          tabIndex={0}
          className={cn('cursor-not-allowed opacity-70', className)}
        >
          {children}
          <span className="sr-only"> (em breve)</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>Em breve</TooltipContent>
    </Tooltip>
  )
}

/**
 * Mesma ideia para AÇÕES (botões). Usa aria-disabled em vez de disabled: assim o botão continua
 * focável pelo teclado e o tooltip "Em breve" aparece — e o clique não faz nada.
 */
export function ComingSoonButton({ children, className }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()}
          className={cn('cursor-not-allowed opacity-60', className)}
        >
          {children}
          <span className="sr-only"> (em breve)</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>Em breve</TooltipContent>
    </Tooltip>
  )
}

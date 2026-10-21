import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

type InputA11y = { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }

type Props = {
  id: string
  label: string
  error?: string
  required?: boolean
  /** Rótulo só para leitor de tela (telas do Figma que usam placeholder no lugar do rótulo). */
  hideLabel?: boolean
  className?: string
  children: (a11y: InputA11y) => ReactNode
}

/**
 * Um campo de formulário: rótulo, input e erro. O erro fica ligado ao input por
 * `aria-describedby` e marca `aria-invalid` — o leitor de tela lê o erro junto com o campo.
 */
export function FormField({ id, label, error, required, hideLabel, className, children }: Props) {
  const errorId = `${id}-erro`
  return (
    <Field data-invalid={Boolean(error)} className={cn('gap-2', className)}>
      {/* `w-px!`: o FieldLabel do shadcn tem `w-fit`, que venceria o 1px do `sr-only` e deixaria o rótulo invisível
          com a largura do texto (estoura a tela em 320px quando o rótulo é longo). */}
      <FieldLabel htmlFor={id} className={cn('text-[15px] font-normal', hideLabel && 'sr-only w-px!')}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </FieldLabel>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined })}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}

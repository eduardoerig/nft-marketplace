import type { ReactNode } from 'react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

type InputA11y = { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }

type Props = {
  id: string
  label: string
  error?: string
  children: (a11y: InputA11y) => ReactNode
}

// Inputs 50px/raio 10 no mobile e 40px/raio 5 no modal desktop, como no Figma.
export const authInputClass = 'h-[50px] rounded-[10px] px-4 sm:h-10 sm:rounded-[5px]'

/**
 * Um campo do formulário: rótulo (só para leitor de tela — o Figma usa placeholder), input e erro.
 * O erro fica ligado ao input por `aria-describedby` e marca `aria-invalid`.
 */
export function AuthField({ id, label, error, children }: Props) {
  const errorId = `${id}-erro`
  return (
    <Field data-invalid={Boolean(error)} className="gap-1.5">
      <FieldLabel htmlFor={id} className="sr-only">
        {label}
      </FieldLabel>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': error ? errorId : undefined })}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  )
}

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from '@/api/client'

/**
 * Leva os erros da API para os campos do formulário (`fields: { email: "…" }` → erro no campo
 * "email"). Devolve a mensagem geral quando o erro não é de nenhum campo, para a tela exibir.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldNames: readonly Path<T>[],
): string | null {
  if (!(error instanceof ApiError)) return 'Algo deu errado. Tente novamente.'
  let matched = false
  for (const [field, message] of Object.entries(error.fields ?? {})) {
    if (fieldNames.includes(field as Path<T>)) {
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !matched })
      matched = true
    }
  }
  return matched ? null : error.message
}

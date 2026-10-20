import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { applyApiErrors } from '@/lib/form-errors'
import { FormField } from '@/components/form-field'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { useChangePassword } from '../queries'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
type Values = z.infer<typeof schema>
const EMPTY: Values = { currentPassword: '', newPassword: '', confirmPassword: '' }

/** "Alterar senha": formulário próprio (outra chamada da API, outra validação). */
export function PasswordForm() {
  const changePassword = useChangePassword()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) => {
    setFormError(null)
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset(EMPTY)
          toast.success('Senha alterada.')
        },
        onError: (error) => setFormError(applyApiErrors(error, setError, ['currentPassword', 'newPassword'])),
      },
    )
  })

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby="senha-titulo"
      className="flex flex-col gap-6 md:max-w-[calc(50%-14px)]"
    >
      <h2 id="senha-titulo" className="text-base font-bold">
        Alterar senha
      </h2>
      <FormField id="senha-atual" label="Senha atual" error={errors.currentPassword?.message}>
        {(a11y) => (
          <PasswordInput {...a11y} {...register('currentPassword')} autoComplete="current-password" />
        )}
      </FormField>
      <FormField id="senha-nova" label="Nova senha" error={errors.newPassword?.message}>
        {(a11y) => <PasswordInput {...a11y} {...register('newPassword')} autoComplete="new-password" />}
      </FormField>
      <FormField id="senha-confirmar" label="Confirmar nova senha" error={errors.confirmPassword?.message}>
        {(a11y) => <PasswordInput {...a11y} {...register('confirmPassword')} autoComplete="new-password" />}
      </FormField>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={changePassword.isPending} className="h-10 w-fit px-10 font-bold">
        {changePassword.isPending ? 'Salvando…' : 'Alterar senha'}
      </Button>
    </form>
  )
}

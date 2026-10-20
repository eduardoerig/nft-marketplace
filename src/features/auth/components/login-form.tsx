import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Session } from '@/api/types'
import { applyApiErrors } from '@/lib/form-errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ComingSoon } from '@/components/layout/coming-soon'
import { PasswordInput } from '@/components/password-input'
import { useLogin } from '../queries'
import { FormField } from '@/components/form-field'
import { authInputClass } from '../styles'

const schema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})
type Values = z.infer<typeof schema>

export function LoginForm({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess,
      onError: (error) => setFormError(applyApiErrors(error, setError, ['email', 'password'])),
    })
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <FormField hideLabel id="login-email" label="E-mail" error={errors.email?.message}>
        {(a11y) => (
          <Input
            {...a11y}
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="contato@email.com"
            className={authInputClass}
          />
        )}
      </FormField>
      <FormField hideLabel id="login-senha" label="Senha" error={errors.password?.message}>
        {(a11y) => (
          <PasswordInput
            {...a11y}
            {...register('password')}
            autoComplete="current-password"
            placeholder="Senha"
            className={authInputClass}
          />
        )}
      </FormField>
      <ComingSoon className="self-end text-sm/4 text-highlight">Esqueceu a senha?</ComingSoon>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button
        type="submit"
        disabled={login.isPending}
        className="mt-6 h-[60px] rounded-[10px] text-base font-bold sm:mt-3 sm:h-[45px] sm:rounded-[5px]"
      >
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Session } from '@/api/types'
import { applyApiErrors } from '@/lib/form-errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { useRegister } from '../queries'
import { AuthField, authInputClass } from './auth-field'

// As mesmas regras da API (src/mocks/handlers/auth.ts): o cliente avisa antes, a API garante.
const schema = z
  .object({
    username: z.string().regex(/^[a-z0-9_.]{3,20}$/i, 'Use de 3 a 20 letras, números, "." ou "_".'),
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
type Values = z.infer<typeof schema>

export function RegisterForm({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const registerUser = useRegister()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(({ username, email, password }) => {
    setFormError(null)
    registerUser.mutate(
      { username, email, password },
      {
        onSuccess,
        onError: (error) => setFormError(applyApiErrors(error, setError, ['username', 'email', 'password'])),
      },
    )
  })

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
      <AuthField id="cadastro-usuario" label="Nome de usuário" error={errors.username?.message}>
        {(a11y) => (
          <Input
            {...a11y}
            {...register('username')}
            autoComplete="username"
            placeholder="Nome de usuário"
            className={authInputClass}
          />
        )}
      </AuthField>
      <AuthField id="cadastro-email" label="E-mail" error={errors.email?.message}>
        {(a11y) => (
          <Input
            {...a11y}
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="Digite seu e-mail"
            className={authInputClass}
          />
        )}
      </AuthField>
      <AuthField id="cadastro-senha" label="Senha" error={errors.password?.message}>
        {(a11y) => (
          <PasswordInput
            {...a11y}
            {...register('password')}
            autoComplete="new-password"
            placeholder="Senha"
            className={authInputClass}
          />
        )}
      </AuthField>
      <AuthField id="cadastro-confirmar" label="Confirmar senha" error={errors.confirmPassword?.message}>
        {(a11y) => (
          <PasswordInput
            {...a11y}
            {...register('confirmPassword')}
            autoComplete="new-password"
            placeholder="Confirmar senha"
            className={authInputClass}
          />
        )}
      </AuthField>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button
        type="submit"
        disabled={registerUser.isPending}
        className="mt-6 h-[60px] rounded-[10px] text-base font-bold sm:mt-3 sm:h-[45px] sm:rounded-[5px]"
      >
        {registerUser.isPending ? (
          'Criando…'
        ) : (
          <>
            <span className="sm:hidden">Criar perfil</span>
            <span className="max-sm:hidden">Criar conta</span>
          </>
        )}
      </Button>
    </form>
  )
}

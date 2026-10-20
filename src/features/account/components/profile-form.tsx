import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Profile } from '@/api/types'
import { applyApiErrors } from '@/lib/form-errors'
import { EnsInput } from '@/components/ens-input'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateProfile } from '../queries'
import { AvatarField } from './avatar-field'

// As mesmas regras da API (src/mocks/handlers/profile.ts).
const schema = z.object({
  displayName: z.string().trim().min(2, 'Use de 2 a 40 caracteres.').max(40, 'Use de 2 a 40 caracteres.'),
  username: z.string().regex(/^[a-z0-9_.]{3,20}$/i, 'Use de 3 a 20 letras, números, "." ou "_".'),
  email: z.email('Informe um e-mail válido.'),
  ensName: z.string().regex(/^([a-z0-9-]{3,30})?$/, 'Use de 3 a 30 letras minúsculas, números ou "-".'),
  walletNickname: z.string().max(30, 'Use até 30 caracteres.'),
})
type Values = z.infer<typeof schema>
const FIELDS = ['displayName', 'username', 'email', 'ensName', 'walletNickname'] as const

function toValues(profile: Profile): Values {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName ?? '',
    walletNickname: profile.walletNickname ?? '',
  }
}

/** Dados do perfil + avatar (grade de 2 colunas do Figma). */
export function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues(profile) })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    updateProfile.mutate(
      { ...values, ensName: values.ensName || null, walletNickname: values.walletNickname || null },
      {
        onSuccess: (saved) => {
          reset(toValues(saved))
          toast.success('Perfil salvo.')
        },
        onError: (error) => setFormError(applyApiErrors(error, setError, FIELDS)),
      },
    )
  })

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby="perfil-titulo" className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        <FormField id="perfil-nome" label="Nome de exibição" required error={errors.displayName?.message}>
          {(a11y) => <Input {...a11y} {...register('displayName')} autoComplete="name" />}
        </FormField>
        <FormField id="perfil-usuario" label="Nome de usuário" required error={errors.username?.message}>
          {(a11y) => <Input {...a11y} {...register('username')} autoComplete="username" />}
        </FormField>
        <FormField id="perfil-email" label="E-mail" required error={errors.email?.message}>
          {(a11y) => <Input {...a11y} {...register('email')} type="email" autoComplete="email" />}
        </FormField>
        <FormField id="perfil-ens" label="Nome ENS" error={errors.ensName?.message}>
          {(a11y) => <EnsInput {...a11y} {...register('ensName')} placeholder="seunome" />}
        </FormField>
        <FormField id="perfil-apelido" label="Apelido da carteira" error={errors.walletNickname?.message}>
          {(a11y) => <Input {...a11y} {...register('walletNickname')} />}
        </FormField>
        <AvatarField profile={profile} />
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={updateProfile.isPending} className="h-10 w-fit px-10 font-bold">
        {updateProfile.isPending ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

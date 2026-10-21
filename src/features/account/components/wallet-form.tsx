import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { NETWORKS, type Wallet } from '@/api/types'
import { applyApiErrors } from '@/lib/form-errors'
import { EnsInput } from '@/components/ens-input'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { NETWORK_LABELS } from '@/features/catalog/search'
import { useSaveWallet } from '../queries'
import {
  PROVIDER_LABELS,
  toWalletInput,
  WALLET_FIELDS,
  walletSchema,
  type WalletFormValues,
} from '../wallet-values'

type Props = {
  kind: Wallet['kind']
  /** Carteira existente (edição). Sem ela, o formulário cadastra uma nova. */
  wallet?: Wallet
  defaultValues: WalletFormValues
  onSaved?: () => void
}

export function WalletForm({ kind, wallet, defaultValues, onSaved }: Props) {
  const saveWallet = useSaveWallet()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(walletSchema), defaultValues })
  const id = (name: string) => `carteira-${kind}-${name}`

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    saveWallet.mutate(
      { id: wallet?.id, input: toWalletInput(kind, values) },
      {
        onSuccess: () => {
          toast.success('Carteira salva.')
          onSaved?.()
        },
        onError: (error) => setFormError(applyApiErrors(error, setError, WALLET_FIELDS)),
      },
    )
  })

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-labelledby={`carteira-${kind}-titulo`}
      className="flex flex-col gap-6"
    >
      {/* Ordem do Figma, em duas colunas: titular e carteira lado a lado, linha a linha. */}
      <div className="grid grid-cols-1 gap-x-7 gap-y-6 md:grid-cols-2">
        <FormField id={id('nome')} label="Nome de exibição" required error={errors.displayName?.message}>
          {(a11y) => <Input {...a11y} {...register('displayName')} autoComplete="name" />}
        </FormField>
        <FormField id={id('apelido')} label="Apelido da carteira" required error={errors.label?.message}>
          {(a11y) => <Input {...a11y} {...register('label')} placeholder="Ex.: Principal" />}
        </FormField>
        <FormField id={id('rede')} label="Rede" required error={errors.network?.message}>
          {(a11y) => (
            <NativeSelect {...a11y} {...register('network')} className="w-full">
              <NativeSelectOption value="" disabled>
                Selecione uma rede
              </NativeSelectOption>
              {NETWORKS.map((network) => (
                <NativeSelectOption key={network} value={network}>
                  {NETWORK_LABELS[network]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField id={id('perfil')} label="Nome do perfil" required error={errors.profileName?.message}>
          {(a11y) => <Input {...a11y} {...register('profileName')} autoComplete="username" />}
        </FormField>
        <FormField id={id('endereco')} label="Endereço da carteira" required error={errors.address?.message}>
          {(a11y) => (
            <Input
              {...a11y}
              {...register('address')}
              placeholder="Endereço 0x da carteira"
              spellCheck={false}
              autoComplete="off"
              className="font-mono"
            />
          )}
        </FormField>
        {/* No Figma este campo não tem rótulo visível (só o texto de exemplo): o rótulo fica para leitor de tela
            e o campo alinha pela base com o endereço ao lado. */}
        <FormField
          hideLabel
          id={id('secundaria')}
          label="ENS ou carteira secundária (opcional)"
          error={errors.secondaryAddress?.message}
          className="md:self-end"
        >
          {(a11y) => (
            <Input
              {...a11y}
              {...register('secondaryAddress')}
              placeholder="ENS ou carteira secundária (opcional)"
              spellCheck={false}
              autoComplete="off"
            />
          )}
        </FormField>
        <FormField id={id('tipo')} label="Tipo de carteira" required error={errors.provider?.message}>
          {(a11y) => (
            <NativeSelect {...a11y} {...register('provider')} className="w-full">
              <NativeSelectOption value="" disabled>
                Selecione uma carteira
              </NativeSelectOption>
              {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField
          id={id('indicacao')}
          label="Código de indicação"
          required
          error={errors.referralCode?.message}
        >
          {(a11y) => (
            <Input
              {...a11y}
              {...register('referralCode')}
              placeholder="Ex.: KURIO-ANA"
              autoComplete="off"
              className="uppercase"
            />
          )}
        </FormField>
        <FormField id={id('email')} label="E-mail" required error={errors.email?.message}>
          {(a11y) => <Input {...a11y} {...register('email')} type="email" autoComplete="email" />}
        </FormField>
        <FormField id={id('ens')} label="Nome ENS" required error={errors.ensName?.message}>
          {(a11y) => <EnsInput {...a11y} {...register('ensName')} placeholder="seunome" />}
        </FormField>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={saveWallet.isPending} className="h-10 w-fit px-4 font-bold">
        {saveWallet.isPending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}

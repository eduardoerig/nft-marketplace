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
      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
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
        <FormField id={id('ens')} label="Nome ENS" error={errors.ensName?.message}>
          {(a11y) => <EnsInput {...a11y} {...register('ensName')} placeholder="opcional" />}
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

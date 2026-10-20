import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import type { Profile } from '@/api/types'
import { Button } from '@/components/ui/button'
import { AVATAR_ACCEPT, AVATAR_MAX_BYTES, toAvatarDataUrl } from '../avatar'
import { useUpdateAvatar } from '../queries'

// "Avatar": círculo + "Alterar" (abre o seletor de arquivo) + "Remover". Salva na hora.
export function AvatarField({ profile }: { profile: Profile }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const updateAvatar = useUpdateAvatar()
  const [error, setError] = useState<string | null>(null)

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return
    setError(null)
    const problem = !AVATAR_ACCEPT.split(',').includes(file.type)
      ? 'Escolha uma imagem PNG, JPEG ou WebP.'
      : file.size > AVATAR_MAX_BYTES
        ? 'A imagem precisa ter até 5 MB.'
        : null
    if (problem) return setError(problem)
    const dataUrl = await toAvatarDataUrl(file).catch(() => null)
    if (!dataUrl) return setError('Não foi possível ler esta imagem.')
    save(dataUrl, 'Avatar atualizado.')
  }

  function save(dataUrl: string | null, message: string) {
    updateAvatar.mutate(
      { dataUrl },
      {
        onSuccess: () => toast.success(message),
        onError: (e) =>
          setError(e instanceof ApiError ? (e.fields?.avatar ?? e.message) : 'Algo deu errado.'),
      },
    )
  }

  return (
    <div role="group" aria-labelledby="avatar-titulo" className="flex flex-col gap-2">
      <p id="avatar-titulo" className="text-[15px]">
        Avatar
      </p>
      <div className="flex items-center gap-6">
        <span className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-input bg-surface-dark">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Seu avatar" className="size-full object-cover" />
          ) : (
            <img src="/icons/curved-image-2.svg" alt="Sem avatar" width={24} height={24} />
          )}
        </span>
        <Button
          type="button"
          size="sm"
          disabled={updateAvatar.isPending}
          onClick={() => fileInput.current?.click()}
          className="h-10 px-6 font-bold"
        >
          {updateAvatar.isPending ? 'Enviando…' : 'Alterar'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!profile.avatarUrl || updateAvatar.isPending}
          onClick={() => save(null, 'Avatar removido.')}
        >
          Remover
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={AVATAR_ACCEPT}
          onChange={onFile}
          aria-label="Escolher imagem do avatar"
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

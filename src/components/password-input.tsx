import { useState, type ComponentProps } from 'react'
import { EyeIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

// Campo de senha com o botão de mostrar/ocultar do Figma (ícone "Hide").
export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[inherit] text-muted-foreground"
      >
        {visible ? (
          <EyeIcon className="size-5" aria-hidden="true" />
        ) : (
          <img src="/icons/curved-hide.svg" alt="" width={20} height={20} />
        )}
      </button>
    </div>
  )
}

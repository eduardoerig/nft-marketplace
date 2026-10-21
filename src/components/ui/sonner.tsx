import { useSyncExternalStore } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from 'lucide-react'

// Avisos com a cara dos modais do site: cartão escuro com borda suave, a faixa dourada embaixo (a mesma
// assinatura dos modais), ícone num círculo tingido e ação como botão pequeno. `unstyled` desliga o visual
// padrão do sonner (ele continua cuidando de posição, empilhamento e gestos).
const iconCircle = 'flex size-8 shrink-0 items-center justify-center rounded-full'

// No mobile o rodapé tem barras fixas (navegação, compra): o aviso desce do topo, que fica livre.
const mobileQuery = '(max-width: 767px)'
const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(mobileQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
const isMobile = () => window.matchMedia(mobileQuery).matches

const Toaster = ({ ...props }: ToasterProps) => {
  const mobile = useSyncExternalStore(subscribe, isMobile)
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position={mobile ? 'top-center' : 'bottom-right'}
      gap={10}
      icons={{
        success: (
          <span className={`${iconCircle} bg-primary/15 text-highlight`}>
            <CircleCheckIcon className="size-4" />
          </span>
        ),
        info: (
          <span className={`${iconCircle} bg-primary/15 text-highlight`}>
            <InfoIcon className="size-4" />
          </span>
        ),
        warning: (
          <span className={`${iconCircle} bg-primary/15 text-highlight`}>
            <TriangleAlertIcon className="size-4" />
          </span>
        ),
        error: (
          <span className={`${iconCircle} bg-destructive/15 text-destructive`}>
            <OctagonXIcon className="size-4" />
          </span>
        ),
        loading: (
          <span className={`${iconCircle} bg-primary/15 text-highlight`}>
            <Loader2Icon className="size-4 animate-spin" />
          </span>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-center gap-3 rounded-2xl border border-border-soft border-b-[3px] border-b-primary bg-card py-3 pr-3 pl-3 font-sans text-card-foreground shadow-overlay sm:w-[400px] data-[type=error]:border-b-destructive',
          icon: 'shrink-0',
          content: 'flex min-w-0 flex-1 flex-col gap-0.5',
          title: 'truncate text-[13px]/5 font-bold',
          description: 'truncate text-xs text-muted-foreground',
          actionButton:
            'shrink-0 cursor-pointer rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

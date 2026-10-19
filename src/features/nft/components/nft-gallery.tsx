import { useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Props = { name: string; images: string[] }

// Galeria do detalhe. Desktop: 4 miniaturas à esquerda + imagem principal com botão de ampliar.
// Mobile: imagem grande + pontos. Miniaturas são botões; as setas do teclado trocam a imagem.
export function NftGallery({ name, images }: Props) {
  const [active, setActive] = useState(0)
  const thumbs = useRef<(HTMLButtonElement | null)[]>([])
  const alt = (i: number) => `${name} — imagem ${i + 1} de ${images.length}`

  function onKeyDown(event: KeyboardEvent) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    const next = (active + step + images.length) % images.length
    setActive(next)
    thumbs.current[next]?.focus()
  }

  return (
    <div className="flex gap-7">
      <div
        role="group"
        aria-label="Imagens do NFT (use as setas para trocar)"
        onKeyDown={onKeyDown}
        className="hidden w-[100px] shrink-0 flex-col gap-4 md:flex"
      >
        {images.map((src, i) => (
          <button
            key={src}
            ref={(el) => {
              thumbs.current[i] = el
            }}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={i === active}
            aria-label={`Mostrar imagem ${i + 1} de ${images.length}`}
            tabIndex={i === active ? 0 : -1}
            className={cn(
              'overflow-hidden rounded-lg border',
              i === active ? 'border-primary' : 'border-transparent',
            )}
          >
            <img src={src} alt="" width={100} height={100} className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>

      <div className="relative flex-1">
        <div className="rounded-3xl p-0 md:rounded-md md:bg-card md:p-4">
          <img
            src={images[active]}
            alt={alt(active)}
            width={404}
            height={404}
            fetchPriority="high"
            className="aspect-square w-full rounded-3xl object-cover"
          />
        </div>

        <Dialog>
          <DialogTrigger
            aria-label="Ampliar imagem"
            className="absolute -top-2 -right-2 hidden size-[30px] items-center justify-center rounded-full border bg-secondary md:flex"
          >
            <img src="/icons/search-icon.svg" alt="" width={18} height={18} />
          </DialogTrigger>
          <DialogContent className="sm:max-w-3xl">
            <DialogTitle>{name}</DialogTitle>
            <DialogDescription className="sr-only">Imagem ampliada</DialogDescription>
            <img src={images[active]} alt={alt(active)} className="w-full rounded-2xl" />
          </DialogContent>
        </Dialog>

        {/* Mobile: pontos no lugar das miniaturas */}
        <div className="mt-3 flex justify-center gap-2 md:hidden">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Mostrar imagem ${i + 1} de ${images.length}`}
              className={cn('h-[7px] rounded-full bg-primary', i === active ? 'w-7' : 'w-[7px] opacity-50')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

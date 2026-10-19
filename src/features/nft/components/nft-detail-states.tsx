import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** Esqueleto com as mesmas dimensões do detalhe (galeria 573px + informações). */
export function NftDetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-3 pt-4 md:pt-8">
      <p role="status" className="sr-only">
        Carregando NFT…
      </p>
      <Skeleton className="hidden h-4 w-36 md:block" />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex gap-7 md:w-[573px] md:shrink-0">
          <div className="hidden w-[100px] flex-col gap-4 md:flex">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="aspect-square flex-1 rounded-3xl md:rounded-md" />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-20 w-2/3" />
        </div>
      </div>
    </div>
  )
}

export function NftNotFound() {
  return (
    <section className="flex flex-col items-center gap-6 py-24 text-center">
      <p className="text-[43px]/[70px] font-bold text-highlight">404</p>
      <h1 className="text-2xl font-bold">NFT não encontrado</h1>
      <p className="max-w-md text-sm/6 text-muted-foreground">
        Este NFT não existe ou foi removido do mercado. Explore o catálogo para encontrar outras obras.
      </p>
      <Button asChild className="uppercase">
        <Link to="/" hash="catalogo" activeOptions={{ includeHash: true }}>
          Explorar o catálogo
        </Link>
      </Button>
    </section>
  )
}

export function NftLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="flex flex-col items-center gap-6 py-24 text-center">
      <h1 className="text-2xl font-bold">Não foi possível carregar este NFT</h1>
      <p className="max-w-md text-sm/6 text-muted-foreground">Verifique sua conexão e tente de novo.</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </section>
  )
}

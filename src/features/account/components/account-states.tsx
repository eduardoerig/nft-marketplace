import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// Estados das telas de conta enquanto os dados não chegam (ou falham).
export function AccountFormSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="grid gap-x-7 gap-y-6 md:grid-cols-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

export function AccountLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 py-8">
      <p className="text-base font-bold">Não foi possível carregar seus dados.</p>
      <p className="text-sm text-muted-foreground">Verifique sua conexão e tente de novo.</p>
      <Button onClick={onRetry}>Tentar novamente</Button>
    </div>
  )
}

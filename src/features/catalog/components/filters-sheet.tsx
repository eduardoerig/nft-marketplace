import { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useNfts } from '../queries'
import { toListParams } from '../search'
import { useCatalogSearch } from '../use-catalog-search'
import { FilterPanel } from './filter-panel'

// Abaixo de 1024px a sidebar some e os filtros abrem neste painel (botão laranja do Figma mobile).
export function FiltersSheet() {
  const [open, setOpen] = useState(false)
  const search = useCatalogSearch()
  const { data } = useNfts(toListParams(search)) // mesmo cache da grade: não faz outra requisição

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Filtros"
        className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-linear-to-b from-primary/45 to-primary lg:hidden"
      >
        <img src="/icons/curved-filter.svg" alt="" width={22} height={22} />
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto p-6">
        <SheetTitle className="text-xl font-bold">Filtros</SheetTitle>
        <SheetDescription className="sr-only">Filtre o catálogo por coleção, preço e rede.</SheetDescription>
        <FilterPanel facets={data?.facets} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

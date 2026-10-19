import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useCatalogSearch, useUpdateCatalogSearch } from '../use-catalog-search'
import { FiltersSheet } from './filters-sheet'

type Props = { id: string; className?: string }

const DEBOUNCE_MS = 300

// Campo "Explorar coleções". O texto digitado só vai para a URL 300ms depois da última tecla.
export function SearchBar({ id, className }: Props) {
  const { q } = useCatalogSearch()
  const updateSearch = useUpdateCatalogSearch()

  // Rascunho local; se a URL mudar por fora (voltar/avançar, "limpar filtros"), ele acompanha.
  const [draft, setDraft] = useState({ q, text: q })
  if (draft.q !== q) setDraft({ q, text: q })

  useEffect(() => {
    if (draft.text.trim() === q) return
    const timer = setTimeout(() => updateSearch({ q: draft.text.trim() }), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft.text, q, updateSearch])

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex h-[45px] flex-1 items-center gap-2 rounded-[10px] bg-card px-3 focus-within:ring-3 focus-within:ring-ring/50">
        <img src="/icons/search-mobile.svg" alt="" width={22} height={22} />
        <label htmlFor={id} className="sr-only">
          Buscar NFTs por nome ou coleção
        </label>
        <input
          id={id}
          type="search"
          value={draft.text}
          onChange={(e) => setDraft({ q, text: e.target.value })}
          placeholder="Explorar coleções"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-placeholder"
        />
      </div>
      <FiltersSheet />
    </div>
  )
}

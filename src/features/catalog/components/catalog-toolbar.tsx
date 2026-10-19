import { Link } from '@tanstack/react-router'
import { NFT_SORTS, NFT_VIEWS, type NftSort } from '@/api/types'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SORT_LABELS, VIEW_LABELS } from '../search'
import { useCatalogSearch, useUpdateCatalogSearch } from '../use-catalog-search'

// Abas "Todos / Novos lançamentos / Em alta" + "Ordenar por".
export function CatalogToolbar() {
  const { view, sort } = useCatalogSearch()
  const updateSearch = useUpdateCatalogSearch()

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <nav aria-label="Abas do catálogo">
        <ul className="flex gap-4 md:gap-5">
          {NFT_VIEWS.map((v) => {
            const active = view === v
            return (
              <li key={v}>
                <Link
                  from="/"
                  to="/"
                  search={(prev) => ({ ...prev, view: v, page: 1 })}
                  resetScroll={false}
                  activeOptions={{ exact: true }}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block border-b-2 pb-1 text-sm whitespace-nowrap md:text-[15px] md:font-medium',
                    active ? 'border-primary font-bold text-highlight' : 'border-transparent',
                  )}
                >
                  {VIEW_LABELS[v]}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-1 text-[15px]">
        <span id="ordenar-label">Ordenar por:</span>
        <Select value={sort} onValueChange={(value) => updateSearch({ sort: value as NftSort })}>
          <SelectTrigger
            aria-labelledby="ordenar-label"
            className="h-auto gap-1 border-none bg-transparent p-0 text-[15px] shadow-none dark:bg-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NFT_SORTS.map((s) => (
              <SelectItem key={s} value={s}>
                {SORT_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

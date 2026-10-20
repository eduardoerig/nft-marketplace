import { useNfts } from '../queries'
import { hasActiveFilters, PAGE_SIZE, toListParams } from '../search'
import { useCatalogSearch } from '../use-catalog-search'
import { CatalogToolbar } from './catalog-toolbar'
import { FeaturedBanner } from './featured-banner'
import { FilterPanel } from './filter-panel'
import { NftGrid } from './nft-grid'
import { Pagination } from './pagination'
import { SearchBar } from './search-bar'

// Seção do catálogo: sidebar (filtros + destaque) à esquerda e grade à direita.
export function Catalog() {
  const search = useCatalogSearch()
  const query = useNfts(toListParams(search))
  const totalPages = query.data ? Math.ceil(query.data.total / PAGE_SIZE) : 0

  return (
    <section id="catalogo" aria-labelledby="catalogo-titulo" className="scroll-mt-6">
      <h2 id="catalogo-titulo" className="sr-only">
        Catálogo de NFTs
      </h2>
      <div className="flex gap-12">
        <aside aria-label="Filtros" className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex">
          <div className="bg-card p-5">
            <FilterPanel facets={query.data?.facets} />
          </div>
          <FeaturedBanner />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-8">
          <SearchBar id="busca" className="max-md:hidden" />
          <CatalogToolbar />
          <NftGrid
            data={query.data}
            error={query.error}
            isPending={query.isPending}
            isRefreshing={query.isPlaceholderData}
            onRetry={() => query.refetch()}
            filtered={hasActiveFilters(search)}
          />
          <Pagination page={search.page} totalPages={totalPages} />
        </div>
      </div>
    </section>
  )
}

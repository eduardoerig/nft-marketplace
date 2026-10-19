import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { Catalog } from '@/features/catalog/components/catalog'
import { HomeBlog } from '@/features/catalog/components/home-blog'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { HomePromos } from '@/features/catalog/components/home-promos'
import { SearchBar } from '@/features/catalog/components/search-bar'
import { catalogSearchDefaults, catalogSearchSchema } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  search: { middlewares: [stripSearchParams(catalogSearchDefaults)] },
  head: () => ({ meta: [{ title: 'Kurio — Marketplace de NFTs' }] }),
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-6 pt-4 md:gap-24 md:pt-8">
      {/* No mobile a busca vem antes do hero, como no Figma. */}
      <SearchBar id="busca-mobile" className="md:hidden" />
      <HomeHero />
      <Catalog />
      <HomePromos />
      <HomeBlog />
    </div>
  )
}

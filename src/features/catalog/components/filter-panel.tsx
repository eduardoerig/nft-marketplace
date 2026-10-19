import { useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CATEGORIES, NETWORKS, type NftListResponse } from '@/api/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { CATEGORY_LABELS, hasActiveFilters, NETWORK_LABELS } from '../search'
import { useCatalogSearch, useUpdateCatalogSearch } from '../use-catalog-search'

// Faixa do slider em centavos de ETH (inteiros): 0,00 a 12,30 ETH, como no Figma.
const MIN_CENTS = 0
const MAX_CENTS = 1230

const toCents = (eth: string | undefined, fallback: number) =>
  eth ? Math.round(Number(eth) * 100) : fallback
const toEth = (cents: number) => (cents / 100).toFixed(2)
const formatBr = (cents: number) => toEth(cents).replace('.', ',')

type Props = {
  facets: NftListResponse['facets'] | undefined
  onNavigate?: () => void // fecha o Sheet no mobile
}

/** Coleções, faixa de preço e rede. Cada clique vira um parâmetro na URL. */
export function FilterPanel({ facets, onNavigate }: Props) {
  const search = useCatalogSearch()
  const id = useId() // o painel aparece na sidebar e no Sheet: ids únicos

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center justify-between rounded-sm text-[15px]/10 hover:text-highlight',
      active ? 'text-highlight' : 'text-muted-foreground',
    )

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby={`${id}-colecoes`} className="flex flex-col gap-3">
        <h3 id={`${id}-colecoes`} className="text-lg/4 font-bold">
          Coleções
        </h3>
        <ul className="px-3">
          {CATEGORIES.map((category) => {
            const active = search.category === category
            return (
              <li key={category}>
                <Link
                  from="/"
                  to="/"
                  search={(prev) => ({ ...prev, category: active ? undefined : category, page: 1 })}
                  resetScroll={false}
                  activeOptions={{ exact: true }}
                  aria-current={active ? 'true' : undefined}
                  onClick={onNavigate}
                  className={linkClass(active)}
                >
                  <span>{CATEGORY_LABELS[category]}</span>
                  <span className="font-bold">({facets?.categories[category] ?? '–'})</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <PriceFilter onNavigate={onNavigate} />

      <section aria-labelledby={`${id}-rede`} className="flex flex-col gap-3">
        <h3 id={`${id}-rede`} className="text-lg/4 font-bold">
          Rede
        </h3>
        <ul className="px-3">
          {NETWORKS.map((network) => {
            const active = search.network === network
            return (
              <li key={network}>
                <Link
                  from="/"
                  to="/"
                  search={(prev) => ({ ...prev, network: active ? undefined : network, page: 1 })}
                  resetScroll={false}
                  activeOptions={{ exact: true }}
                  aria-current={active ? 'true' : undefined}
                  onClick={onNavigate}
                  className={linkClass(active)}
                >
                  <span>{NETWORK_LABELS[network]}</span>
                  <span>({facets?.networks[network] ?? '–'})</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {hasActiveFilters(search) && (
        <Button asChild variant="outline" size="sm">
          <Link to="/" resetScroll={false} activeOptions={{ exact: true }} onClick={onNavigate}>
            Limpar filtros
          </Link>
        </Button>
      )}
    </div>
  )
}

function PriceFilter({ onNavigate }: { onNavigate?: () => void }) {
  const { minPrice, maxPrice } = useCatalogSearch()
  const updateSearch = useUpdateCatalogSearch()
  const id = useId()

  // Rascunho do slider; acompanha a URL quando ela muda por fora.
  const fromUrl = [toCents(minPrice, MIN_CENTS), toCents(maxPrice, MAX_CENTS)]
  const urlKey = `${minPrice}-${maxPrice}`
  const [draft, setDraft] = useState({ urlKey, value: fromUrl })
  if (draft.urlKey !== urlKey) setDraft({ urlKey, value: fromUrl })
  const [low, high] = draft.value

  function apply() {
    updateSearch({
      minPrice: low > MIN_CENTS ? toEth(low) : undefined,
      maxPrice: high < MAX_CENTS ? toEth(high) : undefined,
    })
    onNavigate?.()
  }

  return (
    <section aria-labelledby={`${id}-preco`} className="flex flex-col gap-3">
      <h3 id={`${id}-preco`} className="text-lg/4 font-bold">
        Faixa de preço
      </h3>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={MIN_CENTS}
          max={MAX_CENTS}
          step={1}
          minStepsBetweenThumbs={1}
          value={draft.value}
          onValueChange={(value) => setDraft({ urlKey, value })}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          className="py-2"
        />
        <p className="text-[15px]" aria-live="polite">
          Preço: {formatBr(low)} - {formatBr(high)} ETH
        </p>
        <Button size="sm" onClick={apply} className="w-fit text-lg">
          Aplicar
        </Button>
      </div>
    </section>
  )
}

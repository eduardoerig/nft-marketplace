import { useCallback } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import type { CatalogSearch } from './search'

const homeRoute = getRouteApi('/_home')

/** Busca atual do catálogo (já validada pelo schema da rota). */
export function useCatalogSearch() {
  return homeRoute.useSearch()
}

/**
 * Atualiza a busca na URL. Qualquer mudança de filtro volta para a página 1 (a não ser que
 * `page` venha junto). Cada mudança vira uma entrada no histórico: o "voltar" desfaz uma a uma.
 */
export function useUpdateCatalogSearch() {
  const navigate = homeRoute.useNavigate()
  return useCallback(
    (changes: Partial<CatalogSearch>) =>
      navigate({ search: (prev) => ({ ...prev, page: 1, ...changes }), resetScroll: false }),
    [navigate],
  )
}

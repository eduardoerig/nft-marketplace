# Passo 06 — Início e catálogo

**Tempo alvo:** ~2h · **Desafio:** §3 Catálogo, §4, §8

## Objetivo
Tela Início fiel ao Figma, com catálogo dirigido pela URL.

## O que fazer
1. Layout de `Desktop / Início` e `Mobile / Início` (ver `design/screens/`): destaques + catálogo.
2. Search params validados com zod na rota `/`: `q, category, minPrice, maxPrice, sort, page`.
   Mudar qualquer filtro → `page = 1`. Busca com debounce (~300ms).
3. `features/catalog/queries.ts`: `useNfts(params)` com key `['nfts', params]`, passando `signal`
   (cancela resposta obsoleta) e `placeholderData: keepPreviousData` (atualização em segundo plano visível).
4. Handler `GET /api/nfts` aplicando busca, filtros combinados, ordenação e paginação de verdade.
   `GET /api/nfts/featured` para destaques.
5. Estados: skeleton com shimmer do mesmo tamanho dos cards, vazio ("Nenhum NFT encontrado" + limpar filtros),
   erro com botão "Tentar novamente".
6. Filtros no mobile dentro de `Sheet`. Card leva a `/nfts/$nftId`.
7. Teste E2E: busca + filtro combinado + ordenação + paginação + voltar no histórico restaura.

## Pronto quando
- [ ] Refresh e voltar/avançar mantêm filtros.
- [ ] Visual próximo de `design/screens/` em 1440 e 390.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/06-inicio-catalogo.md
```

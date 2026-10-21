# Passo 01 — Extração do design (Figma)

**Tempo alvo:** ~1h · **Desafio:** §8 (fidelidade, assets)

## Objetivo
Ter tudo do Figma dentro do repo para nenhum passo futuro depender de consultar o Figma de novo.

## O que fazer
1. Carregar a skill `figma-design-to-code`. fileKey `5Ma6UpJeqdO7vTTFPduSPB`; node IDs em `docs/PLAN.md` → "Insumos confirmados".
2. `get_variable_defs` + `get_design_context` nos frames → criar `design/SPEC.md` com:
   - **Tokens**: cores (hex + nome), famílias de fonte e pesos, escala de tamanhos/line-height, espaçamentos, raios, sombras, breakpoints observados.
   - **Mapa frame → rota** (ex.: `Desktop / Início` → `/`).
   - **Inventário de componentes** por tela (Header, Footer, NftCard, FilterBar, Pagination, QuantityStepper, CartSummary, formulários…) com variantes/estados vistos.
3. `get_screenshot` de cada frame (desktop e mobile) → `design/screens/<frame>.png` (maxDimension 2000).
4. Baixar assets (imagens dos NFTs, avatares, logo, ícones SVG) → `public/images/`, `public/icons/`. Fontes: se forem Google Fonts, baixar `.woff2` para `public/fonts/`.
5. Listar no SPEC os assets e qualquer substituição feita.

## Fora do escopo
Nenhum código de app, nenhum `package.json`.

## Pronto quando
- [ ] `design/SPEC.md` com tokens, mapa de rotas e inventário.
- [ ] 15 screenshots em `design/screens/`.
- [ ] Assets e fontes em `public/`.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/01-design.md
```

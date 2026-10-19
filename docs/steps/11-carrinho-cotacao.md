# Passo 11 — Carrinho, cupom e cotação

**Tempo alvo:** ~2h · **Desafio:** §3 Carrinho

## O que fazer
1. Handlers `/api/cart*`: carrinho por usuário ou por `X-Cart-Id` (visitante, id gerado no cliente e salvo em `localStorage`).
   Validar disponibilidade por edição (409 `OUT_OF_STOCK`). `POST /cart/merge` junta o carrinho do visitante ao logar
   (respeitando limites) — chamar no `onSuccess` do login.
2. Handler `POST /api/quote`: calcula subtotal, desconto (cupom), taxa de rede e total **com big.js no mock**;
   retorna `quoteId` + `version`. Cupom inválido/expirado → 422 com mensagem.
3. "Adicionar ao carrinho" no detalhe passa a funcionar.
4. Tela Carrinho (`Desktop / Carrinho de NFTs` + mobile): alterar quantidade, remover, aplicar/remover cupom,
   resumo vindo **só da cotação da API** (front não recalcula). Skeleton no resumo.
5. Badge de quantidade no header.
6. Teste E2E: adicionar, alterar, remover, cupom válido/inválido/expirado, refresh mantém, login preserva itens do visitante.

## Pronto quando
- [ ] Valores batem com a API, sem erro de arredondamento (ex.: 0.1 + 0.2 = 0.3).

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/11-carrinho-cotacao.md
```

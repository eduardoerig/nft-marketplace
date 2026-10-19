# Passo 14 — Status do pedido, confirmação e recibo

**Tempo alvo:** ~1h30 · **Desafio:** §3 Confirmação, §7 (order.updated)

## O que fazer
1. Mock: após criar o pedido, agenda a resolução (ex.: 2s) → `confirmed` (padrão) ou `rejected`
   (cenário `payment-rejected`); emite `order.updated` **só para o dono**, com `version`. Estados terminais não mudam mais.
   Gera `txHash` e link de explorer fictícios.
2. Cenário `order-timeout`: o `POST /orders` cria o pedido mas a resposta estoura timeout; o cliente reenvia com a mesma
   chave e recupera o mesmo pedido.
3. Tela `/orders/$orderId`: `useOrder(id)` via REST + atualização por `order.updated`.
   - `pending`: indicador com `aria-live`;
   - `confirmed`: tela `Desktop / Confirmação de Pedido` (resultado, tx, itens, taxas, total — tudo do snapshot);
   - `rejected`: mensagem + voltar ao carrinho (itens preservados).
   Refresh ou reconexão no `pending` recupera o estado via REST.
4. Ao confirmar: mock remove do carrinho **só** os itens/quantidades comprados; cliente invalida `['cart']`.
5. Mudar o preço depois não altera o recibo.
6. Testes E2E: compra completa catálogo → recibo; pagamento recusado; clique repetido; timeout com recuperação;
   desconexão durante `pending` e retomada.

## Pronto quando
- [ ] Confirmação só aparece com `confirmed` vindo do mock.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/14-status-recibo.md
```

# Passo 13 — Pagamento e criação do pedido

**Tempo alvo:** ~2h · **Desafio:** §3 Pagamento, §5 (idempotência)

## O que fazer
1. Tela Pagamento (`Desktop / Pagamento` + mobile): dados do colecionador (validados), seleção de carteira
   cadastrada e rede, botão "Conectar carteira" simulado (estados: conectando, conectada, recusada, desconectada —
   recusa/desconexão controladas por cenário do mock, ex.: `wallet-reject`).
2. Etapa de revisão (itens, cupom, taxas, total da cotação atual) antes de enviar.
3. Handler `POST /api/orders`:
   - exige `Idempotency-Key`; mesma chave + mesmo corpo → devolve o mesmo pedido; corpo diferente → 409 `IDEMPOTENCY_MISMATCH`;
   - revalida a cotação: se `quoteId`/versão não bate com preço/estoque atual → 409 `QUOTE_STALE` com a nova cotação;
   - cria pedido `pending` com **snapshot** dos itens, valores e cupom.
4. Cliente: `src/lib/idempotency.ts` gera a chave uma vez por tentativa (sessionStorage) e só renova quando o conteúdo muda.
   Botão desabilitado durante envio. `QUOTE_STALE` → mostra diferenças e exige nova confirmação.
5. Sessão expirada no checkout → login com `redirect=/checkout` e dados preenchidos preservados (sessionStorage).
6. Após criar → navegar para `/orders/$orderId`.

## Pronto quando
- [ ] Clicar 5x em "Confirmar" gera 1 pedido só.
- [ ] Mudar preço antes de enviar obriga nova confirmação.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/13-pagamento-pedido.md
```

# Passo 16 — Matriz E2E completa e regressão visual

**Tempo alvo:** ~2h · **Desafio:** §9

## O que fazer
1. Conferir a lista do §9 de `docs/CHALLENGE.md` item a item contra `tests/e2e/` e criar o que faltar
   (um arquivo por área: `catalog`, `nft-detail`, `auth`, `favorites`, `cart`, `checkout`, `realtime`, `account`, `a11y`, `network`).
2. Todo teste parte de estado isolado (fixture de reset) e usa `page.clock` onde há tempo (resolução de pedido, expiração).
3. Eventos de tempo real sempre disparados via `/api/__mock/*` (passando pelo socket.io-client), nunca mexendo no cache.
4. Regressão visual com `toHaveScreenshot` de Início, Detalhe, Carrinho e Pagamento em desktop e mobile,
   dados fixos e animações desligadas. Gerar baselines (`test:e2e:update`) e versionar.
5. Tabela no README: requisito do §9 → arquivo de teste.

## Pronto quando
- [ ] `pnpm test:e2e` verde nos dois projetos, relatório HTML gerado.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/16-testes-e2e.md
```

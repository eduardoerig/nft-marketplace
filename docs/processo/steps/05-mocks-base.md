# Passo 05 — Mocks base (MSW) e Playwright

**Tempo alvo:** ~1h30 · **Desafio:** §6, §9, §12

## Objetivo
API simulada com estado persistente e reset, e a infraestrutura de testes funcionando.

## O que fazer
1. `msw` + `pnpm dlx msw init public`. `src/mocks/browser.ts` com `setupWorker`.
   `main.tsx` só inicia o worker se `import.meta.env.VITE_ENABLE_MOCKS === 'true'` (ligado em `.env` e no build de demo).
2. `src/mocks/db.ts`: estado em memória (`users, sessions, nfts, carts, favorites, wallets, orders, idempotency`)
   salvo em `localStorage['mock-db']` a cada mudança; `reset(scenario)` restaura das fixtures.
3. `src/mocks/fixtures/`: ~60 NFTs (5+ categorias, faixa de preços variada, algumas edições esgotadas),
   2 usuários (`ana@example.com` / `Senha@123`, `bruno@example.com` / `Senha@123`), cupons
   `DESCONTO10` (válido), `EXPIRADO` (expirado). Senhas guardadas como hash SHA-256 + salt.
4. `src/mocks/scenarios.ts`: tabela `{ nome: { latencyMs, failures… } }` — por enquanto só `default`
   (o resto vem no passo 15). Cenário lido de `?scenario=` e salvo em `localStorage`.
5. Handlers em `src/mocks/handlers/` (um arquivo por recurso). Neste passo: `GET /api/nfts` e `GET /api/nfts/:id` simples,
   e controle `POST /api/__mock/reset`.
6. Playwright: `playwright.config.ts` com projetos `desktop` (1440) e `mobile` (390, Chromium),
   `reporter: html`, `trace: 'retain-on-failure'`, `webServer: pnpm build && pnpm preview`.
   `tests/e2e/fixtures.ts` com fixture `resetMocks` que chama `/api/__mock/reset` antes de cada teste.
   1 teste smoke: home carrega e mostra NFTs. Scripts `test:e2e` e `test:e2e:update`.
7. `vercel.json` com rewrite de tudo para `/index.html` (exceto `mockServiceWorker.js` e assets).

## Regra
Nenhum componente/hook importa de `src/mocks/`.

## Pronto quando
- [ ] Network do navegador mostra `/api/nfts` respondido pelo MSW.
- [ ] Refresh mantém o estado; reset restaura.
- [ ] `pnpm test:e2e` verde nos dois projetos.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/05-mocks-base.md
```

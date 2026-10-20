# Passo 12 — Tempo real (Socket.IO + nft.updated)

**Tempo alvo:** ~2h · **Desafio:** §6 (eventos via MSW), §7

> **Antes de começar:** leia em `CLAUDE.md` a seção "Decisões já tomadas que mudam os passos 11–18". Para este passo: desconectar o socket dentro de `useLogout` (`src/features/auth/queries.ts`).

## Objetivo
Mudanças de preço/disponibilidade chegam pelo socket.io-client e atualizam catálogo, detalhe e carrinho.

## O que fazer
1. `socket.io-client` + `@mswjs/socket.io-binding`. `src/mocks/socket.ts`: `ws.link('ws://*/socket.io/*')`
   envolvido pelo binding; na conexão valida o token (`auth.token`) e guarda o socket por `userId`.
   Cliente com `transports: ['websocket']` (limitação do binding — documentar).
2. `db.updateNft(id, patch)` incrementa `version` e emite `nft.updated` para todos; REST e evento ficam coerentes.
   Endpoint de controle `POST /api/__mock/nft-update { nftId, editionId, price?, available? }` e
   `POST /api/__mock/disconnect` (derruba conexões) — usados por testes e pelo painel de dev.
3. `src/realtime/socket.ts`: cria o socket com o token da sessão; recria ao trocar de usuário; desconecta no logout.
4. `src/realtime/useRealtime.ts` (montado no root): guarda `eventId`s vistos e `lastVersion` por recurso;
   ignora duplicado/antigo; aplica `nft.updated` com `setQueryData` no detalhe e `invalidateQueries` em `['nfts']`, `['cart']`, `['quote']`.
   No `connect` após reconexão → invalida os recursos ativos (reconciliação com REST). Remove listeners no unmount.
5. Carrinho: quando item muda, aviso visível + `aria-live="polite"` ("O preço de X mudou de A para B") e resumo atualizado.
6. Teste E2E: NFT no carrinho, disparar `/api/__mock/nft-update`, ver aviso e resumo novo; evento duplicado não reaplica.

## Pronto quando
- [ ] Aba WS do DevTools mostra frames Socket.IO; carrinho reage à mudança.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/12-tempo-real.md
```

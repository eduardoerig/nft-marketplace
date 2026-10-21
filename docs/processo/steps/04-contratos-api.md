# Passo 04 — Contratos da API, Axios e Query

**Tempo alvo:** ~1h · **Desafio:** §4, §5

## Objetivo
Fonte única de tipos e o cliente HTTP prontos. Todo o resto depende disto — **revise com calma**.

## O que fazer
1. `src/api/types.ts` com os DTOs (ETH sempre `string` decimal, quantidades `number` inteiro):
   `User`, `Session`, `Nft`, `NftEdition { id, name, price, available, maxPerOrder }`, `NftListParams`,
   `Paginated<T> { items, page, pageSize, total }`, `CartItem`, `Cart`, `Quote`, `Order`,
   `OrderStatus = 'pending'|'confirmed'|'rejected'`, `Profile`, `Wallet { id, kind: 'primary'|'secondary', address, network, label }`,
   `ApiError { code, message, fields? }`, `RealtimeEvent { eventId, type, resourceId, version, userId?, payload }`.
2. `src/api/client.ts` — Axios com `baseURL: '/api'`, timeout 10s, header `Authorization: Bearer <token>`
   (token em `localStorage['session-token']`), header `X-Cart-Id` (carrinho de visitante),
   interceptor que converte erro em `ApiError` e dispara `window.dispatchEvent(new Event('session-expired'))` em 401.
3. Um arquivo por recurso em `src/api/` com funções tipadas (recebem `signal`):

   | Recurso | Endpoints |
   |---|---|
   | auth.ts | `POST /auth/register`, `POST /auth/login`, `GET /auth/session`, `POST /auth/logout` |
   | nfts.ts | `GET /nfts?q&category&minPrice&maxPrice&sort&page&pageSize`, `GET /nfts/featured`, `GET /nfts/:id` |
   | favorites.ts | `GET /favorites`, `PUT /favorites/:nftId`, `DELETE /favorites/:nftId` |
   | cart.ts | `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `POST /cart/merge` |
   | quote.ts | `POST /quote { couponCode? }` |
   | orders.ts | `POST /orders` (header `Idempotency-Key`), `GET /orders/:id` |
   | profile.ts | `GET /profile`, `PATCH /profile`, `POST /profile/avatar`, `POST /profile/password` |
   | wallets.ts | `GET /wallets`, `POST /wallets`, `PATCH /wallets/:id` |

   Códigos de erro: `VALIDATION` 422, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404,
   `CONFLICT` 409 (inclui `QUOTE_STALE`, `OUT_OF_STOCK`, `EMAIL_TAKEN`, `IDEMPOTENCY_MISMATCH`), `UNAVAILABLE` 503.
4. `src/lib/queryClient.ts` — retry até 2 só para rede/5xx; `staleTime` 30s padrão.
   `src/lib/queryKeys.ts` — chaves centralizadas; chaves privadas incluem `userId`.
5. `src/lib/money.ts` com `big.js`: `add`, `mul`, `formatEth` (string in, string out).
6. Copiar a tabela de endpoints para `docs/API.md` (vira a documentação de contratos).

## Pronto quando
- [ ] `pnpm typecheck` ok.
- [ ] `docs/API.md` com todos os endpoints, corpos e erros.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/04-contratos-api.md
```

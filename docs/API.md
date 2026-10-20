# Contratos da API

API REST simulada pelo MSW (passo 05 em diante). Os tipos citados aqui estão em
[`src/api/types.ts`](../src/api/types.ts) — fonte única; se divergir, vale o código.

## Convenções

- Base: `/api`. JSON em todas as requisições e respostas.
- **ETH** sempre como **string decimal** (`"26.846"`); quantidades são inteiros; datas em ISO 8601.
- Paginação: `page` começa em 1; resposta `Paginated<T> = { items, page, pageSize, total }`.

### Headers

| Header | Quando | Valor |
|---|---|---|
| `Authorization` | Usuário logado | `Bearer <token>` (token salvo em `localStorage['session-token']`) |
| `X-Cart-Id` | Visitante com carrinho | id do carrinho de visitante (`localStorage['guest-cart-id']`) |
| `Idempotency-Key` | `POST /orders` | UUID gerado uma vez por tentativa de checkout |

### Erros

Toda resposta de erro tem o corpo `ApiErrorBody`:

```json
{ "code": "CONFLICT", "reason": "QUOTE_STALE", "message": "Os valores mudaram.", "fields": { "email": "…" } }
```

| `code` | HTTP | Significado |
|---|---|---|
| `VALIDATION` | 422 | Dados inválidos; `fields` traz a mensagem de cada campo |
| `UNAUTHORIZED` | 401 | Sem sessão ou sessão vencida |
| `FORBIDDEN` | 403 | Recurso de outro usuário |
| `NOT_FOUND` | 404 | Recurso inexistente |
| `CONFLICT` | 409 | Conflito de estado (ver `reason`) |
| `UNAVAILABLE` | 503 | Falha transitória — pode tentar de novo |
| `NETWORK` | — | Só no cliente: sem resposta (`reason` `TIMEOUT` ou `OFFLINE`) |

| `reason` | Onde aparece |
|---|---|
| `INVALID_CREDENTIALS` | `POST /auth/login` (401) |
| `SESSION_EXPIRED` | Qualquer rota autenticada (401) |
| `EMAIL_TAKEN`, `USERNAME_TAKEN` | Cadastro e perfil (409) |
| `WRONG_PASSWORD` | Troca de senha (422) |
| `OUT_OF_STOCK` | Carrinho e pedido (409) |
| `COUPON_INVALID`, `COUPON_EXPIRED` | Cotação (422) |
| `QUOTE_STALE` | Pedido com cotação desatualizada (409) |
| `IDEMPOTENCY_MISMATCH` | Pedido: mesma chave, corpo diferente (409) |

O cliente ([`src/api/client.ts`](../src/api/client.ts)) converte qualquer falha em `ApiError`
(com `code`, `reason`, `fields`, `status`). Resposta com corpo que não é JSON (ex.: o `index.html`
quando o MSW não interceptou) também vira `UNAVAILABLE`. Um 401 em requisição **autenticada** dispara o evento
`window` `session-expired`.

## Endpoints

### Sessão e conta — `src/api/auth.ts`

| Método e rota | Corpo | Resposta | Erros |
|---|---|---|---|
| `POST /auth/register` | `RegisterInput { username, email, password }` | 201 `Session` | 422 `VALIDATION`, 409 `EMAIL_TAKEN` / `USERNAME_TAKEN` |
| `POST /auth/login` | `LoginInput { email, password }` | 200 `Session` | 422 `VALIDATION`, 401 `INVALID_CREDENTIALS` |
| `GET /auth/session` | — | 200 `Session` | 401 (sem sessão ou `SESSION_EXPIRED`) |
| `POST /auth/logout` | — | 204 | — |

`Session = { token, user: User, expiresAt }`.

**Política de sessão:** o token fica em `localStorage['session-token']` (sobrevive ao refresh) e vale
2 horas. Senhas só existem no banco simulado como SHA-256 de `salt:senha`. Login com e-mail
inexistente ou senha errada dá a mesma resposta (`INVALID_CREDENTIALS`). Rotas privadas
(`src/routes/_auth/`) checam `['session']` no `beforeLoad`; sem sessão vão a
`/?auth=login&redirect=<url>`. O modal de login/cadastro é o parâmetro `?auth=login|register` de
qualquer página: abre por cima da tela atual (`/login` e `/register` só redirecionam para ele).
Um 401 com token dispara `session-expired`: o app apaga a sessão e o cache privado, avisa e, se a
tela for privada, leva ao login guardando a URL (`src/features/auth/session-expiry.ts`).

### NFTs — `src/api/nfts.ts`

| Método e rota | Parâmetros | Resposta | Erros |
|---|---|---|---|
| `GET /nfts` | `q, category, network, minPrice, maxPrice, view, sort, page, pageSize` | 200 `NftListResponse` | 422 (parâmetro inválido), 503 |
| `GET /nfts/featured` | — | 200 `Nft[]` | 503 |
| `GET /nfts/:id` | — | 200 `Nft` | 404, 503 |

- `category`: `digital-art | photography | music | 3d-art | collectibles | generative | gaming | memberships | utility`
- `network`: `ethereum | polygon | solana`
- `view` (abas): `all | new | trending` · `sort`: `recent | price-asc | price-desc | popular`
- `NftListResponse` = `Paginated<Nft>` + `facets: { categories, networks }` (contagens da sidebar).
- `Nft.editions[]`: `{ id, name, price, available, maxPerOrder }` — `available: 0` = esgotada.

### Favoritos — `src/api/favorites.ts` (autenticado)

| Método e rota | Resposta | Erros |
|---|---|---|
| `GET /favorites` | 200 `string[]` (ids de NFT) | 401 |
| `PUT /favorites/:nftId` | 200 `string[]` (lista atualizada) | 401, 404 |
| `DELETE /favorites/:nftId` | 200 `string[]` | 401 |

### Carrinho — `src/api/cart.ts`

Funciona para visitante (header `X-Cart-Id`) e para usuário logado. Toda resposta é o `Cart`
completo e atualizado: `{ id, items: CartItem[], itemCount, subtotal }`.

| Método e rota | Corpo | Resposta | Erros |
|---|---|---|---|
| `GET /cart` | — | 200 `Cart` | — |
| `POST /cart/items` | `{ nftId, editionId, quantity }` | 200 `Cart` | 404, 409 `OUT_OF_STOCK`, 422 |
| `PATCH /cart/items/:id` | `{ quantity }` | 200 `Cart` | 404, 409 `OUT_OF_STOCK`, 422 |
| `DELETE /cart/items/:id` | — | 200 `Cart` | 404 |
| `POST /cart/merge` | `{ guestCartId }` | 200 `Cart` | 401 |

Adicionar um item que já existe (mesmo `nftId` + `editionId`) soma a quantidade.
`CartItem` traz os valores **atuais** do catálogo (`unitPrice`, `available`, `lineTotal`).

### Cotação — `src/api/quote.ts` (autenticado)

| Método e rota | Corpo | Resposta | Erros |
|---|---|---|---|
| `POST /quote` | `{ couponCode? }` | 200 `Quote` | 401, 409 `OUT_OF_STOCK`, 422 `COUPON_INVALID` / `COUPON_EXPIRED` |

`Quote = { quoteId, version, items, subtotal, coupon, discount, networkFee, total, expiresAt }`.
O `quoteId` muda sempre que preço, disponibilidade, cupom ou taxa mudam — é a referência para o pedido.

### Pedidos — `src/api/orders.ts` (autenticado)

| Método e rota | Corpo | Resposta | Erros |
|---|---|---|---|
| `POST /orders` + `Idempotency-Key` | `OrderInput { quoteId, walletId, network, buyer }` | 201 `Order` (`pending`) | 401, 404 (carteira), 409 `QUOTE_STALE` / `OUT_OF_STOCK` / `IDEMPOTENCY_MISMATCH`, 422, 503 |
| `GET /orders/:id` | — | 200 `Order` | 401, 403, 404 |

- **Idempotência:** mesma chave + mesmo corpo → mesmo pedido (200, sem duplicar).
  Mesma chave + corpo diferente → 409 `IDEMPOTENCY_MISMATCH`.
- **Estados:** `pending → confirmed | rejected` (os dois últimos são terminais).
- O pedido guarda um **snapshot** (itens, valores, carteira): o recibo não muda se o catálogo mudar.
- `transaction { hash, explorerUrl }` só existe em `confirmed`; `failureReason` só em `rejected`.
- Ao confirmar, o servidor remove do carrinho **apenas** os itens e quantidades comprados.

### Perfil — `src/api/profile.ts` (autenticado)

| Método e rota | Corpo | Resposta | Erros |
|---|---|---|---|
| `GET /profile` | — | 200 `Profile` | 401 |
| `PATCH /profile` | `ProfileUpdate` (campos parciais) | 200 `Profile` | 401, 422, 409 `EMAIL_TAKEN` / `USERNAME_TAKEN` |
| `POST /profile/avatar` | `{ dataUrl: string \| null }` | 200 `Profile` | 401, 422 (formato/tamanho) |
| `POST /profile/password` | `{ currentPassword, newPassword }` | 204 | 401, 422 `WRONG_PASSWORD` / `VALIDATION` |

### Carteiras — `src/api/wallets.ts` (autenticado)

| Método e rota | Corpo | Resposta | Erros |
|---|---|---|---|
| `GET /wallets` | — | 200 `Wallet[]` | 401 |
| `POST /wallets` | `WalletInput` | 201 `Wallet` | 401, 422, 409 (já existe carteira desse `kind`) |
| `PATCH /wallets/:id` | `WalletUpdate` | 200 `Wallet` | 401, 403, 404, 422 |

`Wallet = { id, kind: 'primary' | 'secondary', label, address, network, provider, ensName }`.

- Endereço: `0x` + 40 hexadecimais. ENS da carteira com `.eth` (`nova.kurio.eth`); o ENS do perfil
  é guardado sem `.eth`. No `PATCH`, só apelido, endereço, rede, tipo e ENS mudam (`kind` não).
- Avatar: data URL PNG/JPEG/WebP de até 200 mil caracteres. O app recorta e reduz a imagem para
  256×256 antes de enviar (`src/features/account/avatar.ts`); `null` remove.

## Eventos em tempo real (Socket.IO)

Formato comum (`RealtimeEvent`): `{ eventId, type, resourceId, version, userId?, payload }`.

| Evento | `resourceId` | `payload` | Quem recebe |
|---|---|---|---|
| `nft.updated` | id do NFT | `{ price, previousPrice, editions: [{ id, price, available }] }` | Todos |
| `order.updated` | id do pedido | `{ status, transaction, failureReason, updatedAt }` | Só o dono (`userId`) |

O cliente ignora eventos com `eventId` já visto ou `version` menor ou igual à já aplicada.
Detalhes do transporte e da reconciliação com o REST: passo 12.

## Política de cache (TanStack Query)

Configurada em [`src/lib/queryClient.ts`](../src/lib/queryClient.ts); chaves em
[`src/lib/queryKeys.ts`](../src/lib/queryKeys.ts).

| Dado | `staleTime` | Observação |
|---|---|---|
| Catálogo e detalhe | 30 s | Atualizados também por `nft.updated` |
| Sessão (`['session']`) | 60 s | Revalidada ao entrar em rota privada depois de 60 s |
| Carrinho, cotação, pedido | 0 | Sempre revalidados ao montar a tela |
| Perfil, carteiras, favoritos | 30 s | Invalidados após cada mutation |

- **Retry:** até 2 tentativas só em falha transitória (`NETWORK`, `UNAVAILABLE`); nunca em 4xx.
- **Mutations** não repetem sozinhas; o reenvio de pedido é manual e usa a mesma `Idempotency-Key`.
- **Atualização otimista (favoritos):** o coração muda na hora (`onMutate` altera `['favorites', userId]`);
  se a API falhar, `onError` desfaz só aquela mudança e avisa; `onSettled` busca a lista de novo.
  Demonstração: `?scenario=favorites-fail` (favoritar/desfavoritar respondem 503).
- **Isolamento:** chaves privadas incluem o dono (`['cart', userId]`); logout ou troca de usuário
  limpa o cache privado.

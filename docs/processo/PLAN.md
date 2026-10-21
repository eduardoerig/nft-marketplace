# Plano — Marketplace de NFTs (Frontend Challenge)

## Contexto
Desafio de entrevista: marketplace de NFTs em React + TypeScript, fiel ao Figma
(cópia acessível: `5Ma6UpJeqdO7vTTFPduSPB`), com fluxos de descoberta, compra e conta, tudo sobre dados
simulados (MSW + Socket.IO mockado), testes Playwright, auditoria Lighthouse e deploy na Vercel.
Repositório contém apenas README e documentação — projeto ainda não iniciado. Node 22, pnpm 10 disponíveis.

**Diretriz do usuário: código simples e fácil de manter.** Isso vale mais que "esperteza":
poucas abstrações, arquivos pequenos, uma forma de fazer cada coisa, nomes óbvios.

## Insumos confirmados
- **Figma (cópia com acesso)**: `5Ma6UpJeqdO7vTTFPduSPB` — acesso via MCP verificado. Frames:
  | Tela | Desktop (1440) | Mobile (414) |
  |---|---|---|
  | Início | `2:2` | `14:5226` |
  | Detalhes do NFT | `10:244` | `15:5536` |
  | Carrinho | `11:1278` | `16:360` |
  | Pagamento | `11:2862` | `16:748` |
  | Confirmação | `11:4385` | — (adaptar) |
  | Login | `9:115` | `16:1022` |
  | Cadastro | `9:1022` | `16:1228` |
  | Perfil | `9:1238` | — (adaptar) |
  | Carteiras | `9:1670` | — (adaptar) |
- **GitHub**: `eduardoerig/nft-marketplace` (adicionar à sessão com `add_repo` access=push).
- **Vercel**: fica para depois. O projeto já sai com `vercel.json` (rewrite SPA) pronto.

## Regras de git (pedido do usuário)
- **Primeiro passo**: criar `README.md` simples dizendo que o repo é a solução do desafio
  Frontend Challenge (marketplace de NFTs em React + TS), commitar e dar push na `main`.
- **Commits e PRs sem atribuição ao Claude**: sem `Co-Authored-By: Claude…`, sem
  `Claude-Session:`, sem "Generated with Claude Code". Autor = config git do usuário
  (`eduardoerig` / `eduardoferig@gmail.com`). Vale também para os subagentes — instrução explícita no prompt de cada um.

## Decisões de stack (além das obrigatórias)
- **pnpm + Vite** (SPA, build rápido, deploy trivial na Vercel com rewrite para `index.html`).
- **TanStack Router com rotas por arquivo** (plugin Vite) — rotas fáceis de achar.
- **react-hook-form + zod** (padrão do shadcn `Form`); schemas zod reaproveitados nos mocks.
- **big.js** para ETH (strings decimais, sem float). Um único helper `money.ts`.
- **@mswjs/socket.io-binding** + `socket.io-client` com `transports: ['websocket']`.
- ESLint (flat config) + Prettier. Nada de Redux/Zustand: estado remoto = Query, estado de URL =
  Router, sessão = Query (`['session']`). Carrinho vive na API mockada (persistido em localStorage
  pelo mock), então refresh/login funcionam "de graça".

## Estrutura (simples, por feature)
```
src/
  api/            # axios client + 1 arquivo por recurso (nfts.ts, cart.ts, orders.ts...)
    client.ts     # axios: baseURL, interceptor 401 -> evento "session-expired"
    types.ts      # contratos compartilhados (DTOs) — fonte única de tipos
  features/
    catalog/  nft/  cart/  checkout/  orders/  auth/  profile/  wallets/  favorites/
      # cada feature: queries.ts (hooks Query), components/, schema.ts (zod)
  realtime/       # socket.ts (conexão por sessão) + useRealtime.ts (aplica eventos no cache)
  routes/         # arquivos de rota do TanStack Router (finos: só compõem features)
  components/ui/  # shadcn adaptado aos tokens do Figma
  lib/            # money.ts, queryClient.ts, idempotency.ts, a11y (live region)
  mocks/
    db.ts         # estado em memória + persistência localStorage + reset(scenario)
    fixtures/     # ~60 NFTs, 2 usuários, cupons, carteiras
    scenarios.ts  # tabela declarativa de cenários (latência, falhas, eventos)
    handlers/     # 1 arquivo por recurso REST
    socket.ts     # binding socket.io: emite nft.updated / order.updated a partir do db
    browser.ts    # setupWorker; ativado por VITE_ENABLE_MOCKS
tests/e2e/        # specs Playwright + fixtures (resetScenario, emitEvent)
lighthouse/       # config versionada + script (3 runs, mediana)
```
Regra: **componentes nunca importam `mocks/`**; os mocks só existem na camada de rede.

## Decisões técnicas centrais (resumo do que vai no ARCHITECTURE.md)
- **Contratos**: `api/types.ts` define DTOs; erros padronizados `{ code: 'VALIDATION'|'UNAUTHORIZED'|'FORBIDDEN'|'NOT_FOUND'|'CONFLICT'|'UNAVAILABLE', message, fields? }`.
- **Catálogo**: search params validados por zod no Router (`q, category, minPrice, maxPrice, sort, page`); mudar filtro zera `page`. Query key inclui os params; `signal` do Query passado ao axios cancela respostas obsoletas.
- **Sessão**: cookie/token simulado em localStorage pelo mock; `GET /session` no boot. 401 → limpa cache privado, guarda `redirect` e manda para `/login?redirect=…`. Logout/troca de usuário: `queryClient.clear()` + desconecta socket.
- **Isolamento por usuário**: chaves privadas prefixadas com `userId` (`['cart', userId]`).
- **Otimista com rollback**: favoritos (onMutate/onError/onSettled).
- **Carrinho**: itens por `nftId + editionId`; visitante usa `guestCartId`; ao logar `POST /cart/merge`.
- **Cotação**: `POST /quote` retorna `{ quoteId, version, items, subtotal, discount, networkFee, total, expiresAt }`. Pedido exige `quoteId` atual; se mudou → 409 `QUOTE_STALE` → UI pede nova confirmação.
- **Pedidos idempotentes**: `Idempotency-Key` gerada uma vez por tentativa de checkout e salva em sessionStorage; mesma chave+mesmo corpo → mesmo pedido; corpo diferente → 409. Botão desabilita durante envio; timeout → reenvia com a mesma chave.
- **Estados do pedido**: `pending → confirmed | rejected` (terminais). Página `/orders/$id` consulta REST e escuta `order.updated`; recibo é o snapshot salvo no pedido.
- **Tempo real**: eventos `{ eventId, type, resourceId, version, payload }`. Cliente guarda `lastVersion` por recurso e ignora `version <= lastVersion` e `eventId` repetido. Na reconexão: `invalidateQueries` dos recursos ativos. Socket autenticado com o token da sessão; servidor mock só emite pedidos do dono.
- **Mudanças no db mock geram evento**: uma função `db.updateNft()` altera o estado e chama `emit('nft.updated')` → REST e socket sempre coerentes.
- **Cenários**: selecionados por `?scenario=nome` (persistido) ou painel dev discreto; `POST /__mock/reset` e `POST /__mock/emit` (usados também pelos testes, passando pelo MSW e pelo socket.io-client).
- **Senhas**: mock guarda hash SHA-256 com salt (Web Crypto), nunca em claro.

## Execução em passos (controle do usuário, prazo: quarta)

O trabalho está dividido em **18 passos**, um arquivo por passo em [`docs/steps/`](steps/README.md),
com cronograma por dia. Cada arquivo traz objetivo, o que fazer, critérios de pronto e o prompt.
Regra: **um passo por vez**; o agente para ao fim de cada passo e espera o usuário.

O usuário valida cada passo com o checklist [`docs/VALIDACAO.md`](VALIDACAO.md).

## Política de cache (padrão a documentar)
`staleTime` 30s catálogo / 0 para carrinho, cotação e pedido; `retry` 2 só em erros transitórios
(rede/5xx), nunca em 4xx nem em mutations de pedido (o reenvio é manual e idempotente);
`refetchOnWindowFocus` para dados privados; invalidação explícita após cada mutation e evento.

## Verificação
- `pnpm typecheck && pnpm lint` sem erros.
- `pnpm test:e2e` verde em Chromium desktop + mobile; relatório HTML gerado.
- `pnpm build && pnpm preview` + `pnpm lighthouse`: medianas ≥ 90/95/95/90 (justificar desvios).
- `git log --format='%an %ae%n%b' | grep -i claude` vazio (nenhuma atribuição ao Claude).
- Manual no preview (e depois na Vercel): refresh em rotas profundas, compra completa, cenário `price-change`
  durante checkout, cenário `order-timeout`, troca de usuário sem vazamento de dados.
- `git clone` limpo → `pnpm i && pnpm dev` funciona sem serviços externos.

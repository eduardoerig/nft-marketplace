# Instruções para agentes (handoff)

Este repositório é a solução de um desafio de entrevista: marketplace de NFTs em React + TypeScript.
O trabalho será continuado por outro agente/conta. Leia nesta ordem:

1. `docs/CHALLENGE.md` — enunciado completo (fonte da verdade dos requisitos e critérios).
2. `docs/PLAN.md` — plano aprovado: stack, estrutura e decisões técnicas.
3. `docs/steps/NN-*.md` — o passo que o usuário pediu.
4. Este arquivo — status atual, regras e **decisões que valem acima dos arquivos de passo**
   (seção "Decisões já tomadas que mudam os passos 11–18").

## Como trabalhar: UM PASSO POR VEZ (prazo: quarta)
O usuário quer controle total. O trabalho está dividido em **18 passos**, um arquivo por passo em
`docs/steps/` (índice e cronograma em `docs/steps/README.md`). Para cada passo pedido:
1. Faça **só** o que o arquivo do passo pede (subagentes só dentro do passo).
2. Rode `pnpm typecheck && pnpm lint && pnpm test:e2e` (o que já existir).
3. 1 commit `passo NN: <resumo>` (sem atribuição ao Claude) + push na `main`.
4. Marque o passo abaixo com o hash do commit.
5. Responda com o que foi feito e aponte a seção do passo em `docs/VALIDACAO.md`
   (checklist que o **usuário** usa para validar). **Pare** e espere.

### Como o usuário gosta de receber cada passo (pedidos explícitos dele)
- **Explique de forma didática, em português**, o que foi feito e como a estrutura funciona
  (ele está aprendendo com o projeto): pastas/arquivos novos, o "porquê" de cada decisão, bugs achados.
- **Mostre sempre os testes que rodou**: o comando, a saída real (passou/falhou, números) e uma lista
  do que **não** foi testado. Falha intermitente também se relata, mesmo sem causa achada.
- Prove que um teste novo pega o bug (rode-o contra o código sem a correção e mostre que falha).
- **Commits**: revise o diff, adicione arquivos **pelo nome** (nunca `git add -A`: o usuário marca
  itens em `docs/VALIDACAO.md` na mesma pasta e isso já vazou num commit uma vez). Um assunto por
  commit, mensagem com corpo. Ajustes pedidos fora de passo: `ajuste de UI: …` ou `passo NN: ajuste — …`.
  O commit separado `passo NN: marca status no CLAUDE.md` **continua** (o usuário decidiu manter).
  Nunca `force push` sem ele pedir.
- **Fidelidade ao Figma importa muito**: ele confere detalhes (hover, curvas, textos, mobile). Antes de
  dar uma tela por pronta, compare com `design/screens/*.png` e `design/outlines/*.txt`; quando faltar
  medida no outline, meça no PNG (ex.: o recorte da barra inferior foi medido pixel a pixel).

## Status atual
- [x] Plano aprovado e versionado; README inicial.
- [x] **Passos 01–18 concluídos e publicado** em https://nft-marketplace-ebon-delta.vercel.app (projeto Vercel `nft-marketplace`, criado pela CLI).
  Roteiro de validação completo: `docs/CHECKLIST-FINAL.md`.

Passos concluídos (marque com o hash do commit):
- [x] passo 01 — design (8074a5f). Figma via API REST (o MCP no plano Starter esgota em poucas
  chamadas); tudo que os próximos passos precisam está em `design/` — **não consulte o Figma de novo**.
- [x] passo 02 — scaffold (58acc6d). Notas: TypeScript **6.0** (o typescript-eslint ainda não
  suporta o 7); shadcn atual usa o pacote `cn` e trocou `Form` por `Field` (use `Field` +
  react-hook-form); `pnpm dlx` falha nesta máquina — use `npx shadcn@latest add …`.
  Tokens em `src/index.css` (`text-highlight`, `text-placeholder`, `bg-overlay`, `max-w-page`, `skeleton-shimmer`).
- [x] passo 03 — rotas e layout (61cbaa4). Rotas privadas ficam em `src/routes/_auth/` (o `beforeLoad`
  de `_auth.tsx` recebe a proteção no passo 08). Layout em `src/components/layout/`; itens fora do
  escopo usam `<ComingSoon>`. Cada tela substitui seu `<PagePlaceholder>`; o último a sair apaga o arquivo.
- [x] passo 04 — contratos (1ff5076). Tipos em `src/api/types.ts` (erros = `code` + `reason`, ex.:
  `CONFLICT`/`QUOTE_STALE`); o cliente lança `ApiError` (tipo padrão de `error` no Query). Chaves
  privadas usam `owner` (id do usuário ou `guest:<cartId>`). Contas de ETH só via `src/lib/money.ts`.
  Contratos documentados em `docs/API.md` — mocks do passo 05 devem segui-lo.
- [x] passo 05 — mocks e Playwright (446c5c3). **MSW 3**: a opção é `onUnhandledFrame` (não
  `onUnhandledRequest`). Banco em `localStorage['mock-db']`, lido/gravado a cada requisição
  (`readDb`/`updateDb`); mude `SCHEMA_VERSION` em `db.ts` ao alterar o formato. Handlers usam
  `networkDelay()` + `ok()`/`fail()` de `handlers/respond.ts`. Testes: importe `test`/`expect` de
  `tests/e2e/fixtures.ts` (reset automático); chamadas à API nos testes saem da página
  (`mockApi.getJson`), senão não passam pelo MSW. Testes têm tsconfig próprio (`tsconfig.e2e.json`).
- [x] passo 06 — Início e catálogo (a283a09). Feature em `src/features/catalog/` (search.ts = schema
  zod da URL + rótulos; `useCatalogSearch`/`useUpdateCatalogSearch`). Listas de valores
  (`CATEGORIES`, `NETWORKS`, `NFT_SORTS`, `NFT_VIEWS`) moram em `src/api/types.ts`. **Armadilha do
  TanStack Link:** link ativo recebe `aria-current="page"` à força e a busca compara de forma parcial —
  links do catálogo usam `activeOptions={{ exact: true }}`; links com `hash` usam `{ includeHash: true }`.
  Após `reload()` nos testes, a API só responde quando `window.__mocksReady` (o fixture já espera).
  O dev server às vezes não vê pastas novas do Tailwind: reinicie se uma classe "não pegar".
- [x] passo 07 — detalhe do NFT (3c9ce8d). Feature em `src/features/nft/`. `QuantityStepper` é
  compartilhado (`src/components/`) — o carrinho deve reutilizá-lo. "Comprar", "Favoritar" e
  "Adicionar ao carrinho" usam `ComingSoonButton` (aria-disabled + "Em breve") até os passos 10/11:
  troque pelos botões reais lá. Ao mudar fixtures, aumente `SCHEMA_VERSION` (`src/mocks/db.ts`).
  Testes: clique na pílula (`<label>`), não no `<input>` sr-only; o Playwright não clica em
  elementos `aria-disabled` (use foco + teclado).
- [x] passo 08 — login e sessão (2bc6bf8). Feature em `src/features/auth/`. O modal de login/cadastro
  é o parâmetro `?auth=login|register` de QUALQUER página (validado no `__root.tsx`): abre por cima
  da tela atual; `/login` e `/register` só redirecionam para `/?auth=…`. Rota privada sem sessão →
  `/?auth=login&redirect=<url>`.
  Rotas autenticadas no mock começam com `requireUser(db, request)` (`src/mocks/handlers/auth.ts`).
  Erros da API → campos com `applyApiErrors` (`src/lib/form-errors.ts`); senha com `PasswordInput`.
  Chaves privadas: use `session.user.id` como `owner`; `clearPrivateData` mantém só `nfts` e `session`.
  Testes logam pelo modal (`tests/e2e/auth.spec.ts` tem os helpers).
- [x] passo 09 — perfil e carteiras (914c8e4). Feature em `src/features/account/`; layout de conta em
  `src/routes/_auth/account.tsx` (menu "Meu perfil": "Lista de interesse" ainda é "Em breve").
  Campos de formulário: `FormField` (`src/components/form-field.tsx`, com `hideLabel` no login) +
  `NativeSelect` para selects. Rotas privadas leem o usuário de `context.session` (vem do `_auth`).
  **Desvios do Figma** ficam em `design/SPEC.md` ("Desvios do Figma") — o passo 18 leva ao ARCHITECTURE.md.
  TanStack `activeProps` só concatena classes: para estilo do link ativo use `data-[status=active]:`.
- [x] passo 10 — favoritos (e6ee5d0). Feature em `src/features/favorites/`; `FavoriteButton` no card e no
  detalhe. Otimista: rollback desfaz A MUDANÇA (não restaura cópia — a cópia pode ser undefined).
  Botões que dependem da sessão esperam `useSession().isPending` (senão tratam logado como deslogado).
  Cenários de mock: `failFavorites` em `src/mocks/scenarios.ts` (o passo 15 acrescenta os demais).
  Card: botões ficam ao lado do `<Link>` (não dentro) — o passo 11 põe o "carrinho" do hover ali.
  Tela de favoritos ("Lista de interesse"/aba Favoritos) não está no escopo do passo: segue "Em breve".
- [x] ajustes pedidos pelo usuário depois do passo 10 (todos com E2E):
  - `f0e540a`/`39611fb` card do catálogo (desktop): fileira carrinho · favoritar · ver só no hover ou
    foco de **teclado** (`group-has-focus-visible`) — `:focus-within` deixava a fileira presa após clique.
  - `b5ff67b` hero troca de destaque a cada 6 s; pausa no hover/foco, botão pausar, respeita
    "reduzir movimento" (WCAG 2.2.2). Teste usa `page.clock`.
  - `d542d57` **mobile sem header do site** (nenhum frame mobile tem): abaixo de 768px a navegação é a
    `MobileTabBar`; telas internas usam `MobilePageHeader` (voltar + título) e `BackButton`
    (`src/components/layout/`). Tablet (768–1023) mantém header + menu ☰.
  - `e07dd4f` hero mobile com os círculos dourados e o texto curto do frame mobile.
  - `c8b07a7` recorte da barra inferior em SVG (curva medida no PNG do Figma).
  - antes disso: `5693653` o MSW "morria" com a aba em segundo plano (Chrome desliga o service worker);
    `src/mocks/browser.ts` religa ao voltar para a aba. `74a41fd`: resposta não-JSON vira `ApiError`.
- [x] passo 11 — carrinho e cotação (c054330). Feature em `src/features/cart/` (`useCart`, `useQuote`,
  `useAddToCartAction`, `CartLink` com o selo). Dono no cache: `session.user.id` ou `guest:<id>` (o id do
  visitante nasce no 1º `useCart`). **A cotação não exige login** (mudança registrada em `docs/API.md`);
  cupom aplicado fica em `/cart?cupom=` — o passo 13 deve ler esse parâmetro (ex.: o link "Conectar e
  finalizar" passar `cupom` para `/checkout`). Mock em `src/mocks/handlers/cart.ts` (`toCart`, `limitOf`,
  quoteId por hash do conteúdo). `NftShelf` (catalog) substituiu o `RelatedNfts`.
<!-- ex.: - [x] passo 01 — design (abc1234) -->
- [x] passo 12 — tempo real (6bac067). Servidor simulado em `src/mocks/realtime.ts` (`updateNft` grava e emite;
  `emit` respeita `userId` — o passo 14 só precisa chamar `emit` com `order.updated` e `userId`). Cliente em
  `src/realtime/` (`connectSocket`, `useRealtime` no `__root`): para `order.updated`, acrescente um listener
  ali com o mesmo `isNew`. Rotas de controle: `/api/__mock/nft-update|replay|disconnect|connections`; nos
  testes, `mockApi.postJson` e `mockApi.waitForSocket()` (espere o socket antes de disparar evento).
  **Armadilhas:** o socket usa `path: '/realtime/'` (o MSW tira `/socket.io/` da URL e colidiria com o
  WebSocket do Vite) e o `socket.io-client` é importado sob demanda (guarda o `WebSocket` no import, antes
  do MSW). O aviso do carrinho (`useCartChanges`) compara dados, não eventos. Passo 13 ("preço muda durante
  o checkout"): `/api/__mock/nft-update` já serve para o teste.
- [x] passo 13 — pagamento e pedido (eb0768e). Feature em `src/features/checkout/` (`CheckoutForm`, `ReviewDialog`,
  `WalletConnect`, `OrderLines` e `PriceSummary` — os dois últimos servem ao recibo do passo 14). Mock em
  `src/mocks/handlers/orders.ts` (pedido `pending` com snapshot; revalida com `buildQuote` de `cart.ts`).
  Chave de idempotência em `src/lib/idempotency.ts` (por conteúdo, sessionStorage). `useCreateOrder` já reenvia
  sozinho em falha de rede com a mesma chave (base do cenário `order-timeout`). Cenários novos: `wallet-reject`,
  `wallet-disconnect`. Testes de compra usam `tests/e2e/shop-helpers.ts` (`startCheckout`, `connectWallet`…).
- [x] passo 14 — status e recibo (9b76c92). Feature em `src/features/orders/` (`useOrder`, `OrderReceipt`); a rota
  abre o recibo como Dialog sempre aberto (fechar → início). Mock resolve o pedido por `resolveAt` (timer na aba +
  `GET` que resolve/reagenda) e emite `order.updated` com `userId`. Cenários novos: `payment-rejected`,
  `order-timeout` (flags `rejectPayment`, `loseOrderResponse`). `SCHEMA_VERSION` = 3. `PagePlaceholder` removido.
  Testes que vencem a sessão no meio de uma tela esperam `networkidle` antes (corrida de 401 em voo).
- [x] passo 15 — cenários de rede (f6c7f15). Tabela + `applyScenario` em `src/mocks/scenarios.ts` (handler
  `http.all('/api/*')` no topo; falhas fixas = regras `fail`, regras de negócio = flags; `firstTime(key)` para
  "só na 1ª vez"). Não há mais `networkDelay`. Painel em `src/components/dev-panel.tsx` (lazy, só com mocks).
  Mensagens de erro via `errorHint` (`src/lib/error-hint.ts`). **Armadilha de teste:** `getByRole(..., { name })`
  casa por trecho — a grade é `{ name: 'NFTs', exact: true }` (senão pega o skeleton "Carregando NFTs").
- [x] passo 16 — matriz E2E e visual (db9a3c7; ajuste de foco em 81fddec). `a11y.spec.ts` (teclado/foco — o axe do
  passo 17 entra aqui), `visual.spec.ts` + baselines win32 (`pnpm test:e2e:update` para regenerar; esconda o botão
  do painel e use movimento reduzido). Diálogos sem DialogTrigger usam `useReturnFocus` (`src/lib/`). Tabela §9 →
  arquivo no README. `mocks.spec.ts` tem `retries: 2` (CDP fecha a aba às vezes); o flake do account não reapareceu
  em 100 execuções.
- [x] passo 17 — a11y, responsivo, Lighthouse (34a4ac5). axe em `a11y.spec.ts` (falha em serious/critical);
  `responsive.spec.ts` (320–1440, sem rolagem horizontal). App renderiza antes do MSW: chamadas esperam
  `apiReady` (`src/lib/api-ready.ts`). Parâmetros de URL sem zod (`src/lib/search-params.ts` + `SearchSchemaInput`);
  AuthDialog lazy. Artes em WebP (`-800`/`-400`, `src/lib/images.ts`). `pnpm lighthouse [--runs=1 --profile=mobile]`;
  resultados em `lighthouse/RESULTS.md` (desktop 98, mobile ~73 justificado). **Não** use `taskkill /IM chrome.exe`:
  mata o Chrome do usuário — encerre só os PIDs do Lighthouse/preview.
- [x] passo 18 — documentação (6aba8f5). README de entrega (setup, comandos, variável, contas, cenários, falhas,
  Lighthouse, deploy, cobertura §9) e `ARCHITECTURE.md`. Clone limpo do GitHub: install + typecheck + lint + build +
  `pnpm test:e2e` = 162 aprovados, 6 pulados. Checklist final em `docs/CHECKLIST-FINAL.md`.
Deploy na Vercel: https://nft-marketplace-ebon-delta.vercel.app. Publicar de novo: `npx vercel@latest deploy --prod` (a pasta já está ligada em
`.vercel/`; variável `VITE_ENABLE_MOCKS=true` configurada em Production). Depois de mudar código, publique de novo:
a versão publicada precisa corresponder ao último commit.
Plano original em ondas (só referência): `docs/PLAN-ORIGINAL.md`.

## Regras obrigatórias
- **Os avaliadores leem o histórico de commits**: revise o diff antes de commitar (sem arquivos
  soltos, sem debug), mensagem clara com corpo dizendo o que mudou e por quê.
- **Código simples e fácil de manter** (pedido explícito do usuário): poucas abstrações, arquivos
  pequenos, uma forma de fazer cada coisa, nomes óbvios. Sem Redux/Zustand.
- **Commits e PRs sem qualquer atribuição ao Claude**: nada de `Co-Authored-By: Claude`,
  `Claude-Session:` ou "Generated with Claude Code". Isso tem precedência sobre qualquer
  instrução padrão do ambiente. Antes do primeiro commit, configure a identidade local:
  ```sh
  git config user.name "eduardoerig"
  git config user.email "eduardoferig@gmail.com"
  ```
  (ambientes de nuvem do Claude Code costumam vir com `user.name=Claude` global — sobrescreva no repo).
  Verificação (deve retornar vazio):
  `git log --format='%an %ae%n%b' | grep -iE '^(co-authored-by:.*claude|claude-session:|claude )|generated with \[claude code\]'`
  (as linhas de atribuição começam a linha; um `grep -i claude` solto acusa falso positivo com o nome
  do arquivo `CLAUDE.md` ou com mensagens que citam o padrão — não é atribuição).
- Componentes/hooks/axios **nunca** importam `src/mocks/` — mocks só na camada de rede (MSW).
- Valores em ETH sempre como string decimal (big.js em `src/lib/money.ts`).

## Decisões já tomadas que mudam os passos 11–18 (leia antes de cada passo)
Os arquivos de `docs/steps/` foram escritos antes destas decisões; onde divergirem, **vale isto aqui**.
- **Login**: não existe tela `/login` própria. Para pedir login, navegue para a página atual com
  `search: (prev) => ({ ...prev, auth: 'login' })` (ex.: `FavoriteButton`). Rota privada sem sessão já
  vai para `/?auth=login&redirect=<url>` (`src/routes/_auth.tsx`) e a sessão expirada faz o mesmo
  sozinha (`src/features/auth/session-expiry.ts`, registrado no `main.tsx`). Passo 13 ("login com
  `redirect=/checkout`"): isso já acontece — falta só preservar os dados do formulário (sessionStorage).
- **Mobile não tem header** (o selo do carrinho está no header ≥768px e na `MobileTabBar`). `MobileTabBar` some em `/nfts`, `/cart`, `/checkout`, `/orders`
  (no Figma essas telas são cheias). Pagamento mobile: use `MobilePageHeader` ("Pagamento com carteira").
- **Logout** (`useLogout`): no passo 12, desconecte o socket ali também.
- **Cenários do mock** (passo 15): `src/mocks/scenarios.ts` já tem `default` e `favorites-fail`
  (flag `failFavorites` lida no handler). Ao criar `applyScenario`, migre esse caso para ele.
  Trocar de cenário com `?scenario=` **reseta o banco** (é preciso logar de novo).
- **Code-splitting por rota já está ligado** (`autoCodeSplitting` no `vite.config.ts`) — passo 17.
- **Textos do hero**: desktop e mobile usam o texto do seu próprio frame (decisão revista em `design/SPEC.md`).
- **Desvios do Figma** decididos até aqui estão em `design/SPEC.md` → "Desvios do Figma" (passo 18 leva
  para o ARCHITECTURE.md). Registre lá todo desvio novo.

## Problemas conhecidos e dicas do ambiente
- **Falhas intermitentes**: `mocks.spec.ts` — o CDP `stopAllWorkers` às vezes fecha a aba (artefato da automação;
  o arquivo tem `retries: 2`). `account.spec.ts` "perfil: editar nome" (1 vez no passo 10) não reapareceu em 100
  execuções no passo 16. Rode suítes novas com `--repeat-each=3`.
  O teste de sessão expirada já pegou duas corridas (requisição em voo levando o 401 antes do `reload`):
  hoje ele espera `networkidle` — toda tela nova que busca dados no carregamento pode afetar isso.
- **Corridas comuns nos testes**: esperar o dado carregar antes de agir (ex.: valor no campo, não só o
  título); esperar o servidor salvar antes de `reload()` (o otimista mostra antes da API responder).
- **Dev server**: depois de editar, a aba às vezes fica com o módulo antigo em cache — Ctrl+F5. Pasta nova
  do Tailwind pode exigir reiniciar o `pnpm dev`. Os E2E rodam no build (`pnpm build && preview`), sem isso.
- **Máquina do usuário (Windows)**: não há `python`; `pnpm dlx` falha (use `npx`). Para editar arquivos,
  prefira as ferramentas de edição a scripts de shell com aspas aninhadas (já quebraram várias vezes).

## Figma
- Arquivo com acesso via MCP (cópia do usuário): fileKey `5Ma6UpJeqdO7vTTFPduSPB`
  (https://www.figma.com/design/5Ma6UpJeqdO7vTTFPduSPB/Frontend-Challenge--c%C3%B3pia-?node-id=0-1).
  Se uma nova conta não tiver acesso, peça ao usuário para duplicar o arquivo original de novo.
- Node IDs dos frames: tabela em `docs/PLAN.md` → "Insumos confirmados".
- Antes de `get_design_context`, carregue a skill `figma-design-to-code`.

## Comandos (criados nos passos 02 e 05)
`pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm typecheck` · `pnpm lint` ·
`pnpm test:e2e` · `pnpm test:e2e:update` · `pnpm lighthouse`

Contas de teste: `ana@example.com` (principal + secundária) e `bruno@example.com` (só principal),
senha `Senha@123`. Cenário de falha: `?scenario=favorites-fail`; volta com `?scenario=default`.

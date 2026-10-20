# Instruções para agentes (handoff)

Este repositório é a solução de um desafio de entrevista: marketplace de NFTs em React + TypeScript.
O trabalho será continuado por outro agente/conta. Leia nesta ordem:

1. `docs/CHALLENGE.md` — enunciado completo (fonte da verdade dos requisitos e critérios).
2. `docs/PLAN.md` — plano aprovado: stack, estrutura e decisões técnicas.
3. `docs/steps/NN-*.md` — o passo que o usuário pediu.
4. Este arquivo — status atual e regras.

## Como trabalhar: UM PASSO POR VEZ (prazo: quarta)
O usuário quer controle total. O trabalho está dividido em **18 passos**, um arquivo por passo em
`docs/steps/` (índice e cronograma em `docs/steps/README.md`). Para cada passo pedido:
1. Faça **só** o que o arquivo do passo pede (subagentes só dentro do passo).
2. Rode `pnpm typecheck && pnpm lint && pnpm test:e2e` (o que já existir).
3. 1 commit `passo NN: <resumo>` (sem atribuição ao Claude) + push na `main`.
4. Marque o passo abaixo com o hash do commit.
5. Responda com o que foi feito e aponte a seção do passo em `docs/VALIDACAO.md`
   (checklist que o **usuário** usa para validar). **Pare** e espere.

## Status atual
- [x] Plano aprovado e versionado; README inicial.
- [ ] **Próximo: passo 11** — `docs/steps/11-carrinho-cotacao.md`.

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
<!-- ex.: - [x] passo 01 — design (abc1234) -->
Deploy na Vercel: **adiado** pelo usuário (passo 18).
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
  Verificação: `git log --format='%an %ae%n%b' | grep -i claude` deve retornar vazio.
- Componentes/hooks/axios **nunca** importam `src/mocks/` — mocks só na camada de rede (MSW).
- Valores em ETH sempre como string decimal (big.js em `src/lib/money.ts`).

## Figma
- Arquivo com acesso via MCP (cópia do usuário): fileKey `5Ma6UpJeqdO7vTTFPduSPB`
  (https://www.figma.com/design/5Ma6UpJeqdO7vTTFPduSPB/Frontend-Challenge--c%C3%B3pia-?node-id=0-1).
  Se uma nova conta não tiver acesso, peça ao usuário para duplicar o arquivo original de novo.
- Node IDs dos frames: tabela em `docs/PLAN.md` → "Insumos confirmados".
- Antes de `get_design_context`, carregue a skill `figma-design-to-code`.

## Comandos (criados nos passos 02 e 05)
`pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm typecheck` · `pnpm lint` ·
`pnpm test:e2e` · `pnpm test:e2e:update` · `pnpm lighthouse`

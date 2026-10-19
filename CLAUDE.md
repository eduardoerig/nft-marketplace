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
- [ ] **Próximo: passo 03** — `docs/steps/03-rotas-layout.md`.

Passos concluídos (marque com o hash do commit):
- [x] passo 01 — design (8074a5f). Figma via API REST (o MCP no plano Starter esgota em poucas
  chamadas); tudo que os próximos passos precisam está em `design/` — **não consulte o Figma de novo**.
- [x] passo 02 — scaffold (58acc6d). Notas: TypeScript **6.0** (o typescript-eslint ainda não
  suporta o 7); shadcn atual usa o pacote `cn` e trocou `Form` por `Field` (use `Field` +
  react-hook-form); `pnpm dlx` falha nesta máquina — use `npx shadcn@latest add …`.
  Tokens em `src/index.css` (`text-highlight`, `text-placeholder`, `bg-overlay`, `max-w-page`, `skeleton-shimmer`).
<!-- ex.: - [x] passo 01 — design (abc1234) -->

Deploy na Vercel: **adiado** pelo usuário (passo 18).
Plano original em ondas (só referência): `docs/PLAN-ORIGINAL.md`.

## Regras obrigatórias
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

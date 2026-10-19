# Instruções para agentes (handoff)

Este repositório é a solução de um desafio de entrevista: marketplace de NFTs em React + TypeScript.
O trabalho será continuado por outro agente/conta. Leia nesta ordem:

1. `docs/CHALLENGE.md` — enunciado completo (fonte da verdade dos requisitos e critérios).
2. `docs/PLAN.md` — plano aprovado: stack, estrutura, decisões técnicas e os 36 passos.
3. Este arquivo — status atual e regras.

## Como trabalhar: UM PASSO POR VEZ
O usuário quer controle total. O trabalho está dividido em 36 passos pequenos em
`docs/PLAN.md` → "Execução em passos pequenos". Siga o **ritual** descrito lá:
faça **só** o passo pedido ("faça o passo N"), commit `passo N: ...`, push, marque abaixo,
explique como validar e **pare**. Nunca adiante passos sem o usuário pedir.

## Status atual
- [x] Plano aprovado e versionado; README inicial.
- [ ] **Próximo: passo 1** — tokens do Figma em `design/SPEC.md`.

Passos concluídos (marque com o hash do commit):
<!-- ex.: - [x] passo 1 — tokens (abc1234) -->

Deploy na Vercel: **adiado** pelo usuário (passo 36).

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

## Comandos (criados nos passos 5–10)
`pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm typecheck` · `pnpm lint` ·
`pnpm test:e2e` · `pnpm test:e2e:update` · `pnpm lighthouse`

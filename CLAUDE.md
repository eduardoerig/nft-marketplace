# Instruções para agentes (handoff)

Este repositório é a solução de um desafio de entrevista: marketplace de NFTs em React + TypeScript.
O trabalho será continuado por outro agente/conta. Leia nesta ordem:

1. `docs/CHALLENGE.md` — enunciado completo (fonte da verdade dos requisitos e critérios).
2. `docs/PLAN.md` — plano aprovado: stack, estrutura, decisões técnicas e ondas de subagentes.
3. Este arquivo — status atual e regras.

## Status atual
- [x] Plano aprovado e versionado (`docs/PLAN.md`).
- [x] README inicial.
- [ ] **Próximo passo: Onda 0** (extração do design do Figma → `design/SPEC.md`, tokens, assets em `public/`, screenshots em `design/`).
- [ ] Onda 1 — fundação (scaffold Vite + pnpm, Tailwind, shadcn, Router, Query, Axios, `api/types.ts`, mocks base, Playwright, Lighthouse).
- [ ] Ondas 2–5 — ver `docs/PLAN.md`.
- Deploy na Vercel: **adiado** pelo usuário; deixar `vercel.json` pronto.

Atualize esta seção ao concluir cada onda.

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

## Comandos (a criar na Onda 1)
`pnpm dev` · `pnpm build` · `pnpm preview` · `pnpm typecheck` · `pnpm lint` ·
`pnpm test:e2e` · `pnpm test:e2e:update` · `pnpm lighthouse`

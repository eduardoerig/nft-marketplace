# Passo 02 — Scaffold do projeto

**Tempo alvo:** ~45min · **Desafio:** §2 (stack), §12 (comandos)

## Objetivo
Projeto rodando com Vite + React + TypeScript + Tailwind + shadcn/ui, já com os tokens do Figma.

## O que fazer
1. `pnpm create vite . --template react-ts` (manter README/docs existentes).
2. TypeScript `strict`, alias `@/` → `src/`.
3. ESLint (flat config, `typescript-eslint`, `react-hooks`) + Prettier. Scripts:
   `dev`, `build`, `preview`, `typecheck` (`tsc -b --noEmit`), `lint`, `format`.
4. Tailwind CSS (v4 com `@tailwindcss/vite`) com os tokens de `design/SPEC.md` como variáveis CSS
   em `src/index.css` (`@theme`). Fontes locais via `@font-face` com `font-display: swap`.
5. `shadcn init` e adicionar: `button`, `input`, `label`, `form`, `select`, `checkbox`, `dialog`,
   `sheet`, `skeleton`, `sonner`, `badge`, `separator`. Ajustar cores/raios ao Figma.
6. Skeleton com shimmer (keyframe CSS) que respeita `prefers-reduced-motion`.
7. `App.tsx` temporário mostrando Button, Input e Skeleton no estilo do Figma.
8. `.nvmrc` (22), `.gitignore` (node_modules, dist, test-results, playwright-report).

## Pronto quando
- [ ] `pnpm i && pnpm dev` abre a página de teste com visual do Figma.
- [ ] `pnpm typecheck && pnpm lint && pnpm build` sem erros.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/02-scaffold.md
```

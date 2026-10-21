# Passo 17 — Acessibilidade, responsividade e Lighthouse

**Tempo alvo:** ~2h · **Desafio:** §8, §10

> **Antes de começar:** leia em `CLAUDE.md` a seção "Decisões já tomadas que mudam os passos 11–18". Para este passo: o code-splitting por rota já está ligado; o mobile não tem header (tablet e desktop têm).

## O que fazer
1. **A11y**: navegar todas as telas só com teclado; foco visível; foco preso e devolvido em Dialog/Sheet;
   labels e erros associados; `alt` nas imagens; contraste ≥ 4.5:1; estados com texto/ícone além de cor;
   `aria-live` em mutations e eventos. Usar `@axe-core/playwright` num teste por tela.
2. **Responsivo**: 390, 768 e 1440 sem overflow horizontal; zoom 200% sem perder conteúdo.
3. **Performance**: code-splitting por rota (`autoCodeSplitting` do router), imagens WebP/AVIF com `width/height`
   e `loading="lazy"` (exceto LCP com `fetchpriority="high"`), preload da fonte principal, meta description e `lang`.
4. **Lighthouse**: `lighthouse/config.cjs` + `lighthouse/run.mjs` que faz build+preview, roda Início e Detalhe em mobile
   e desktop, 3 vezes cada, salva HTML/JSON em `lighthouse/reports/` e escreve `lighthouse/RESULTS.md` com medianas,
   LCP/CLS/TBT, versões (Node, Chrome, Lighthouse) e condições. Script `pnpm lighthouse`.
5. Justificar no RESULTS.md qualquer nota abaixo da meta (90/95/95/90).

## Pronto quando
- [ ] axe sem violações sérias; `lighthouse/RESULTS.md` gerado.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/17-a11y-responsivo-lighthouse.md
```

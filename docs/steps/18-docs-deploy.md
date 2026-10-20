# Passo 18 — Documentação e deploy

**Tempo alvo:** ~1h30 · **Desafio:** §12

> **Antes de começar:** leia em `CLAUDE.md` a seção "Decisões já tomadas que mudam os passos 11–18". Para este passo: os desvios do Figma já registrados estão em `design/SPEC.md` → "Desvios do Figma"; as regras de sessão, cache e otimista, em `docs/API.md`.

## O que fazer
1. **README.md**: o que é, setup (`pnpm i`, `pnpm dev`), variáveis (`VITE_ENABLE_MOCKS`), credenciais fictícias,
   como escolher/resetar cenários (`?scenario=`, painel de dev), como reproduzir cada falha, todos os comandos,
   link para relatório Playwright e Lighthouse, tabela de cobertura de testes.
2. **ARCHITECTURE.md**: estrutura de pastas, contratos REST (link `docs/API.md`) e eventos, política de sessão,
   estado do carrinho, cache/retries/invalidação, reconciliação REST ↔ Socket.IO, idempotência,
   transporte do socket mockado e limitações, decisões de UX, desvios do Figma, ajustes de acessibilidade.
3. Teste de checkout limpo: `git clone` em pasta nova → `pnpm i && pnpm build && pnpm test:e2e`.
4. **Deploy Vercel** (quando o usuário liberar): importar repo, build `pnpm build`, output `dist`,
   env `VITE_ENABLE_MOCKS=true`. Conferir na URL pública: refresh em `/nfts/<id>` e `/checkout`,
   compra completa, evento de preço pelo painel.
5. Atualizar `CLAUDE.md` marcando tudo como concluído.

## Pronto quando
- [ ] Clone limpo funciona; URL pública com mocks e tempo real funcionando.

## Prompt
```
Leia o CLAUDE.md e execute docs/steps/18-docs-deploy.md
```

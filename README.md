# NFT Marketplace

Solução para o **Frontend Challenge**: um marketplace de NFTs com fluxos de descoberta, compra e conta do colecionador, em versões desktop e mobile.

## Stack

React · TypeScript · TanStack Router · TanStack Query · Axios · Socket.IO · Tailwind CSS · shadcn/ui · MSW · Playwright · Lighthouse

## Status

Em desenvolvimento. Instruções de instalação, execução e testes serão adicionadas aqui.

- Enunciado: [`docs/CHALLENGE.md`](docs/CHALLENGE.md)
- Plano de implementação: [`docs/PLAN.md`](docs/PLAN.md)
- Passos de implementação: [`docs/steps/`](docs/steps/README.md)
- Checklist de validação: [`docs/VALIDACAO.md`](docs/VALIDACAO.md)

## Cobertura de testes (§9 do desafio)

`pnpm test:e2e` roda tudo em Chromium, nos projetos **desktop** (1440×900) e **mobile** (390×844), contra o build de
produção com os mocks ligados. Cada teste parte do estado inicial (reset automático em `tests/e2e/fixtures.ts`).
Relatório HTML em `playwright-report/` (`npx playwright show-report`); traces e screenshots só das falhas.

| Requisito do §9 | Onde |
|---|---|
| Busca, filtros combinados, ordenação, paginação e histórico | `catalog.spec.ts` |
| Acesso direto ao detalhe e recurso inexistente | `nft-detail.spec.ts`, `smoke.spec.ts` (404) |
| Cadastro, login, expiração de sessão (inclusive pelo relógio), logout e troca de usuário | `auth.spec.ts` |
| Favoritos, falha de mutation e recuperação do estado | `favorites.spec.ts` |
| Carrinho, quantidades, remoção, cupom, persistência após refresh/login | `cart.spec.ts` |
| Compra completa, do catálogo ao recibo confirmado | `orders.spec.ts` |
| Falha de pagamento, clique repetido e timeout com recuperação do mesmo pedido | `orders.spec.ts`, `checkout.spec.ts` |
| Perfil, avatar, senha e carteiras, com erros de validação | `account.spec.ts` |
| Preço/disponibilidade via Socket.IO durante o checkout | `checkout.spec.ts`, `realtime.spec.ts`, `network.spec.ts` |
| Eventos duplicados ou antigos, desconexão e retomada de pedido pendente | `realtime.spec.ts`, `orders.spec.ts` |
| Navegação por teclado, foco de diálogos e validação de formulários | `a11y.spec.ts`, `checkout.spec.ts`, `auth.spec.ts` |
| Skeletons em carregamento lento, feedback de falha e nova tentativa | `network.spec.ts` |
| Regressão visual de Início, Detalhe, Carrinho e Pagamento | `visual.spec.ts` (baselines em `visual.spec.ts-snapshots/`) |

- **Tempo real** sempre pelo `socket.io-client`: os testes disparam eventos pelas rotas `/api/__mock/*` (nada de
  mexer no cache do app).
- **Relógio:** `page.clock` na troca automática do hero e na expiração da sessão.
- **Baselines visuais** foram geradas no Windows. Em outro sistema as fontes são desenhadas de outro jeito:
  gere de novo com `pnpm test:e2e:update` antes de comparar.

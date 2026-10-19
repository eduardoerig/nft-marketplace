# Passos de implementação

Cada arquivo desta pasta é **um passo autocontido**: objetivo, o que fazer, critérios de pronto e
um prompt pronto para colar no agente. Faça **um por vez**, na ordem.

## Como usar
Cole no agente:
```
Leia o CLAUDE.md e execute docs/steps/NN-nome.md
```
O agente faz só aquele passo, roda `pnpm typecheck && pnpm lint && pnpm test:e2e` (o que já existir),
faz 1 commit `passo NN: ...` (sem atribuição ao Claude), dá push, marca o passo no `CLAUDE.md`,
diz como validar e **para**.

## Cronograma (prazo: quarta-feira)
| Dia | Passos | Meta do dia |
|---|---|---|
| **Segunda** | 01 → 05 | Design extraído, projeto rodando, rotas, contratos e mocks base |
| **Terça** | 06 → 12 | Catálogo, detalhe, conta, favoritos, carrinho e tempo real |
| **Quarta** | 13 → 18 | Checkout, pedido, cenários de rede, testes, qualidade, docs e deploy |

Se atrasar, **não pule a ordem**: corte acabamento (passo 17) antes de cortar fluxo.
Itens **eliminatórios** do desafio (nunca cortar): stack usada de verdade, fluxos funcionando
(não só visual), compra confirmada só via resposta do mock, sem vazamento entre usuários,
eventos via socket.io-client (nunca direto na UI), testes E2E executáveis.

## Lista
| # | Arquivo | Resumo |
|---|---|---|
| 01 | [01-design.md](01-design.md) | Tokens, screenshots, assets e inventário do Figma |
| 02 | [02-scaffold.md](02-scaffold.md) | Vite + TS + Tailwind + shadcn + lint |
| 03 | [03-rotas-layout.md](03-rotas-layout.md) | TanStack Router, layout, 404 |
| 04 | [04-contratos-api.md](04-contratos-api.md) | Tipos, Axios, Query, money |
| 05 | [05-mocks-base.md](05-mocks-base.md) | MSW, db, fixtures, cenários, Playwright smoke |
| 06 | [06-inicio-catalogo.md](06-inicio-catalogo.md) | Início, busca, filtros, ordenação, paginação |
| 07 | [07-detalhe-nft.md](07-detalhe-nft.md) | Detalhe do NFT |
| 08 | [08-auth-sessao.md](08-auth-sessao.md) | Login, cadastro, sessão, rotas protegidas |
| 09 | [09-perfil-carteiras.md](09-perfil-carteiras.md) | Perfil, avatar, senha, carteiras |
| 10 | [10-favoritos.md](10-favoritos.md) | Favoritos otimistas com rollback |
| 11 | [11-carrinho-cotacao.md](11-carrinho-cotacao.md) | Carrinho, cupom, cotação |
| 12 | [12-tempo-real.md](12-tempo-real.md) | Socket.IO + `nft.updated` |
| 13 | [13-pagamento-pedido.md](13-pagamento-pedido.md) | Pagamento + pedido idempotente |
| 14 | [14-status-recibo.md](14-status-recibo.md) | `order.updated`, confirmação e recibo |
| 15 | [15-cenarios-rede.md](15-cenarios-rede.md) | Lentidão, timeout, offline, 4xx/5xx |
| 16 | [16-testes-e2e.md](16-testes-e2e.md) | Matriz E2E completa + regressão visual |
| 17 | [17-a11y-responsivo-lighthouse.md](17-a11y-responsivo-lighthouse.md) | Acessibilidade, responsividade, Lighthouse |
| 18 | [18-docs-deploy.md](18-docs-deploy.md) | README, ARCHITECTURE.md, Vercel |

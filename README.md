# NFT Marketplace

Solução para o **Frontend Challenge**: um marketplace de NFTs com fluxos de descoberta, compra e conta do colecionador, em versões desktop e mobile.

## Stack

React · TypeScript · TanStack Router · TanStack Query · Axios · Socket.IO · Tailwind CSS · shadcn/ui · MSW · Playwright · Lighthouse

Tudo funciona sem backend: a API REST e os eventos Socket.IO são simulados no navegador pelo **MSW**, com dados
persistidos no `localStorage` e cenários de falha determinísticos.

## Documentação

| Documento | Conteúdo |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Camadas, sessão, carrinho, cache, reconciliação REST ↔ Socket.IO, idempotência, mocks, decisões de UX, desvios do Figma, acessibilidade e limitações |
| [`docs/API.md`](docs/API.md) | Contratos REST e de eventos, erros, transporte do socket simulado, tabela de cenários |
| [`design/SPEC.md`](design/SPEC.md) | Tokens e inventário do Figma, assets e desvios |
| [`lighthouse/RESULTS.md`](lighthouse/RESULTS.md) | Notas do Lighthouse (medianas) e condições |
| [`docs/VALIDACAO.md`](docs/VALIDACAO.md) | Checklist manual de validação, passo a passo |
| [`docs/CHALLENGE.md`](docs/CHALLENGE.md) | Enunciado do desafio |

## Como rodar

Requisitos: **Node 22+** e **pnpm 10** (`corepack enable` instala o pnpm do `packageManager`).

```bash
pnpm install
pnpm dev            # http://localhost:5173, com a API simulada
```

Testes E2E (precisam do Chromium do Playwright uma vez):

```bash
npx playwright install chromium
pnpm test:e2e       # build de produção + preview + Playwright (desktop e mobile)
```

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento com os mocks |
| `pnpm build` | Verifica tipos e gera o build de produção em `dist/` (com os mocks, como a demonstração) |
| `pnpm preview` | Serve o `dist/` em http://localhost:4173 |
| `pnpm typecheck` | TypeScript sem gerar arquivos |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier (com ordenação de classes do Tailwind) |
| `pnpm test:e2e` | Playwright; relatório em `playwright-report/` (`npx playwright show-report`) |
| `pnpm test:e2e:update` | Regenera as baselines da regressão visual |
| `pnpm lighthouse` | Build + preview + Lighthouse (Início e Detalhe, mobile e desktop, 3×) → `lighthouse/RESULTS.md` |

## Variáveis de ambiente

| Variável | Padrão (`.env`) | Efeito |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Liga a API e o Socket.IO simulados (MSW) no dev, no preview e no build. Com `false`, o app chama `/api` de verdade (não existe backend neste desafio) e os mocks ficam fora do bundle. |

## Contas de teste

| E-mail | Senha | Observação |
|---|---|---|
| `ana@example.com` | `Senha@123` | Carteira principal (MetaMask, Ethereum) e secundária (Coinbase, Polygon) |
| `bruno@example.com` | `Senha@123` | Só a carteira principal |

Cupons: `DESCONTO10` (10%), `EXPIRADO` (vencido). Contas novas podem ser criadas pelo cadastro.

## Cenários da API simulada

Escolha um cenário de três formas (trocar de cenário **reseta os dados** — entre de novo):
- pela URL: `http://localhost:5173/?scenario=slow` (fica salvo até trocar);
- pelo **painel de testes**: botão com o frasco no canto inferior esquerdo (só existe com os mocks ligados), que
  também reseta os dados, muda preços ao vivo e derruba o socket;
- pela API de controle: `POST /api/__mock/reset { "scenario": "slow" }`.

Para **resetar** os dados: "Resetar dados" no painel, `?scenario=default` na URL ou `POST /api/__mock/reset`.

| Cenário | Como reproduzir a falha |
|---|---|
| `default` | Tudo funciona (250 ms por resposta). |
| `empty` | Início sem NFTs: estado vazio. |
| `slow` | Qualquer tela: skeletons por 2 s. |
| `variable-latency` | Navegue: cada resposta leva 100 ms–1,5 s, sempre na mesma sequência. |
| `out-of-order` | Busque "Golden" e logo "Ape": a resposta antiga chega depois e não vence a nova. |
| `offline` | Início: "Sem conexão com o servidor" + "Tentar novamente". |
| `server-error` | Início: erro depois de 3 tentativas; "Tentar novamente" carrega. |
| `unauthorized` | Entre: o token é recusado e o app volta a "deslogado". |
| `session-expired` | Entre: "Sua sessão expirou. Entre novamente." |
| `register-conflict` | Cadastro: "Este e-mail já está cadastrado." no campo. |
| `favorites-fail` | Logado, clique num coração: ele acende, volta e aparece o aviso. |
| `price-change-checkout` | Pagamento → "Confirmar e pagar": a revisão mostra o preço novo e pede nova confirmação. |
| `sold-out-checkout` | Pagamento → "Confirmar e pagar": "esgotou" + "Voltar ao carrinho". |
| `order-timeout` | Compre: a 1ª resposta se perde, o app reenvia e o pedido é um só. |
| `payment-rejected` | Compre: "Pagamento recusado"; os itens continuam no carrinho. |
| `wallet-reject` | Pagamento → "Conectar": "A conexão foi recusada na carteira." |
| `wallet-disconnect` | Pagamento → "Confirmar e pagar": "A carteira desconectou…". |

Tempo real à mão (console do navegador, com a página aberta):

```js
fetch('/api/__mock/nft-update', { method: 'POST', body: JSON.stringify({ nftId: '7', editionId: 'ed-1-50', price: '1.5' }) })
```

## Lighthouse (§10)

`pnpm lighthouse` faz o build, sobe o preview e audita Início e Detalhe em mobile e desktop, 3 vezes cada
(mediana). Resultado atual — detalhes, versões, condições e a justificativa do que ficou abaixo da meta em
[`lighthouse/RESULTS.md`](lighthouse/RESULTS.md); relatórios HTML/JSON da rodada mediana em `lighthouse/reports/`:

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|---|
| Início | mobile | 72 | 100 | 100 | 100 |
| Início | desktop | 98 | 100 | 100 | 100 |
| Detalhe | mobile | 74 | 100 | 100 | 100 |
| Detalhe | desktop | 98 | 100 | 100 | 100 |

## Deploy (Vercel)

Ainda não publicado. Para publicar: importe o repositório na Vercel, build `pnpm build`, saída `dist`, variável
`VITE_ENABLE_MOCKS=true`. O [`vercel.json`](vercel.json) já reescreve qualquer rota para o `index.html` (acesso
direto e refresh em `/nfts/1`, `/checkout`…), mantendo de fora o worker do MSW, os assets e o `robots.txt`.

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

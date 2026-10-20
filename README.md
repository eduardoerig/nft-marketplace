# Kurio — NFT Marketplace

Solução para o **Frontend Challenge**: um marketplace de NFTs com fluxos de descoberta, compra e conta do
colecionador, em versões desktop e mobile.

| | |
|---|---|
| **Aplicação publicada** | _URL pública da Vercel (preencher após o deploy)_ |
| **Repositório** | https://github.com/eduardoerig/nft-marketplace |
| **Rodar em localhost** | [`README-LOCAL.md`](README-LOCAL.md) — instalação, comandos, testes e auditoria na sua máquina |

## Sumário

1. [Sobre o projeto](#sobre-o-projeto)
2. [Como avaliar na URL pública](#como-avaliar-na-url-pública)
   - [Antes de começar](#antes-de-começar)
   - [Roteiro sugerido](#roteiro-sugerido)
   - [Rotas para acesso direto](#rotas-para-acesso-direto)
   - [O que observar no DevTools](#o-que-observar-no-devtools)
3. [Contas e cupons de teste](#contas-e-cupons-de-teste)
4. [Cenários da API simulada e falhas](#cenários-da-api-simulada-e-falhas)
5. [Variáveis de ambiente](#variáveis-de-ambiente)
6. [Rodar localmente (resumo)](#rodar-localmente-resumo)
7. [Lighthouse](#lighthouse-10)
8. [Cobertura de testes](#cobertura-de-testes-9-do-desafio)
9. [Documentação](#documentação)

## Sobre o projeto

**Stack:** React · TypeScript · TanStack Router · TanStack Query · Axios · Socket.IO · Tailwind CSS · shadcn/ui · MSW ·
Playwright · Lighthouse.

Não há backend: a API REST e os eventos Socket.IO são simulados **dentro do navegador** pelo MSW (um service
worker), com dados salvos no `localStorage` e cenários de falha determinísticos. A versão publicada é o mesmo
build de produção dos testes (`pnpm build`, com `VITE_ENABLE_MOCKS=true`): login, carrinho, pagamento, pedidos e
tempo real funcionam completos na URL pública, sem nenhum servidor além da hospedagem.

## Como avaliar na URL pública

### Antes de começar
- Use Chrome ou Edge atualizado. Uma **janela anônima** garante um estado limpo.
- Na primeira visita o navegador instala a API simulada (leva um instante). Os dados ficam **no seu
  navegador**: cada avaliador tem o seu banco, e nada do que você faz aparece para outra pessoa.
- **Painel de testes:** botão com o frasco, no canto inferior esquerdo. Por ele você:
  - troca o cenário (lentidão, erros, pagamento recusado…);
  - reseta os dados;
  - muda preço ou disponibilidade de um NFT ao vivo;
  - derruba o socket para ver a reconexão.
- **Voltar ao estado inicial:** painel → "Resetar dados", ou abra `/?scenario=default`.
- **Contas:** `ana@example.com` / `Senha@123` e `bruno@example.com` / `Senha@123` (ver
  [contas e cupons](#contas-e-cupons-de-teste)).

### Roteiro sugerido
Cerca de 15 minutos, cobrindo os fluxos e os pontos de avaliação do enunciado. O roteiro completo, item por item,
está em [`docs/CHECKLIST-FINAL.md`](docs/CHECKLIST-FINAL.md).

1. **Catálogo:**
   - busque "Ape", combine coleção, rede e preço, mude a ordenação e a página;
   - a URL guarda tudo: refresh mantém e voltar/avançar do navegador desfaz e refaz;
   - mudar um filtro volta para a página 1.
2. **Detalhe:**
   - abra `/nfts/1` direto na barra;
   - `/nfts/999` mostra "NFT não encontrado";
   - edições esgotadas aparecem desabilitadas e a quantidade para no limite da edição.
3. **Login e retorno:** deslogado, clique no coração de um NFT. O login abre por cima da página e, depois de
   entrar, você continua onde estava.
4. **Carrinho de visitante:**
   1. Saia da conta e clique em "COMPRAR" no Golden Beat #207 (`/nfts/7`).
   2. Entre como Ana: o item continua no carrinho.
   3. Teste os cupons `DESCONTO10`, `EXPIRADO` e `XYZ`.
5. **Tempo real no carrinho:** com o Golden Beat no carrinho, abra o painel e emita a mudança (NFT `7`, edição
   `1/50`, preço `1.5`). O carrinho avisa "O preço … mudou de … para …" e o resumo se atualiza sem recarregar.
6. **Pagamento:**
   1. "Conectar e finalizar" → conecte a carteira → "Confirmar compra".
   2. Com a revisão aberta, mude o preço pelo painel: o diálogo mostra o antes → depois e exige nova confirmação.
   3. Clique várias vezes em "Confirmar e pagar": o resultado é **um** pedido.
7. **Pedido:**
   - "Confirmando seu pedido" vira o recibo em ~2 s;
   - recarregue no meio: o pedido continua;
   - depois de confirmado, mude o preço: o recibo não muda (snapshot);
   - no carrinho, só os itens comprados saíram.
8. **Conta:** edite o perfil, troque o avatar e a senha (a atual errada dá erro no campo), cadastre e edite as
   carteiras principal e secundária. Recarregue: tudo persiste.
9. **Isolamento:** saia e entre como Bruno. Nada da Ana aparece (carrinho, favoritos, perfil); a URL de um pedido
   da Ana mostra "Pedido não encontrado".
10. **Falhas:** use os [cenários](#cenários-da-api-simulada-e-falhas) pela URL ou pelo painel (ex.:
    `/?scenario=payment-rejected`, `/?scenario=offline`).
11. **Responsividade e teclado:**
    - DevTools → modo responsivo em 390, 768 e 1440 px;
    - navegue só com Tab, Enter e Esc: o 1º Tab é "Pular para o conteúdo", e os diálogos prendem e devolvem o
      foco.

### Rotas para acesso direto
Todas abrem direto pela barra de endereço e aguentam refresh:

| Rota | Tela |
|---|---|
| `/` | Início (catálogo; filtros na URL, ex.: `/?sort=price-asc&page=2`) |
| `/nfts/1` | Detalhe do NFT |
| `/cart` | Carrinho (`/cart?cupom=DESCONTO10` já aplica o cupom) |
| `/checkout` | Pagamento (pede login) |
| `/orders/<id>` | Status do pedido e recibo (pede login) |
| `/account/profile` | Perfil do colecionador (pede login) |
| `/account/wallets` | Carteiras (pede login) |
| `/?auth=login` | Login sobre a página atual (também `/login` e `/register`) |
| `/qualquer-coisa` | Página 404 |

### O que observar no DevTools
- **Console:** cada requisição à API simulada aparece numa linha `[MSW]`. Os quadros Socket.IO aparecem como
  `⬇ 42["nft.updated",…]` e `42["order.updated",…]`. Eles **não** aparecem em Network → WS, porque o socket é
  simulado dentro da página (detalhes em [`docs/API.md`](docs/API.md)).
- **Application → Local Storage → `mock-db`:** o banco simulado. Lá dá para ver os pedidos (um por compra, mesmo
  com cliques repetidos) e as senhas guardadas só como hash + salt.
- **Network → Img:** as artes são WebP (~13 KB nos cards, ~40 KB no detalhe).

## Contas e cupons de teste

| E-mail | Senha | Observação |
|---|---|---|
| `ana@example.com` | `Senha@123` | Carteira principal (MetaMask, Ethereum) e secundária (Coinbase, Polygon) |
| `bruno@example.com` | `Senha@123` | Só a carteira principal |

Cupons: `DESCONTO10` (10%) e `EXPIRADO` (vencido). Contas novas podem ser criadas pelo cadastro.

## Cenários da API simulada e falhas

Escolha um cenário de três formas (trocar de cenário **reseta os dados** — entre de novo):
- pela URL: `<URL pública>/?scenario=slow` (fica salvo até trocar);
- pelo **painel de testes** (botão com o frasco no canto inferior esquerdo), que também reseta os dados, muda
  preços ao vivo e derruba o socket;
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

## Variáveis de ambiente

| Variável | Padrão (`.env`) | Efeito |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Liga a API e o Socket.IO simulados (MSW) no dev, no preview e no build. Com `false`, o app chama `/api` de verdade (não existe backend neste desafio) e os mocks ficam fora do bundle. |

A versão publicada é gerada com `VITE_ENABLE_MOCKS=true` — por isso a API simulada e o tempo real funcionam nela.

## Rodar localmente (resumo)

O guia completo para a sua máquina está em **[`README-LOCAL.md`](README-LOCAL.md)**. Ele cobre os cenários em
localhost, o tempo real pelo console, os testes, o Lighthouse e os problemas comuns.

Resumo: o projeto roda a partir de um checkout limpo, sem serviço privado nem backend. Requisitos: Node 22+ e
pnpm 10 (`corepack enable`). Depois de instalar e subir o servidor, abra http://localhost:5173.

```bash
pnpm install
```

```bash
pnpm dev
```

Os testes E2E precisam do Chromium do Playwright uma vez: `npx playwright install chromium`.

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

## Documentação

| Documento | Conteúdo |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Camadas, sessão, carrinho, cache, reconciliação REST ↔ Socket.IO, idempotência, mocks, decisões de UX, desvios do Figma, acessibilidade e limitações |
| [`docs/API.md`](docs/API.md) | Contratos REST e de eventos, erros, transporte do socket simulado, tabela de cenários |
| [`design/SPEC.md`](design/SPEC.md) | Tokens e inventário do Figma, assets e desvios |
| [`lighthouse/RESULTS.md`](lighthouse/RESULTS.md) | Notas do Lighthouse (medianas) e condições |
| [`docs/VALIDACAO.md`](docs/VALIDACAO.md) | Checklist manual de validação, passo a passo |
| [`docs/CHALLENGE.md`](docs/CHALLENGE.md) | Enunciado do desafio |
| [`docs/CHECKLIST-FINAL.md`](docs/CHECKLIST-FINAL.md) | Roteiro completo de validação, na ordem do enunciado |
| [`README-LOCAL.md`](README-LOCAL.md) | Como rodar, testar e auditar em localhost |

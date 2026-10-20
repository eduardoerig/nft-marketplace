# Kurio — NFT Marketplace

Solução para o **Frontend Challenge**: um marketplace de NFTs com fluxos de descoberta, compra e conta do
colecionador, em versões desktop e mobile.

**Aplicação publicada:** _(a URL da Vercel entra aqui depois do deploy — ver [Tutorial de deploy](#tutorial-de-deploy-na-vercel))_

## Sumário

1. [Sobre o projeto](#sobre-o-projeto)
2. [Usando a aplicação publicada](#usando-a-aplicação-publicada)
3. [Tutorial de deploy na Vercel](#tutorial-de-deploy-na-vercel)
   - [Passo a passo pelo painel](#passo-a-passo-pelo-painel)
   - [Alternativa: pela linha de comando](#alternativa-pela-linha-de-comando)
   - [Conferindo o deploy](#conferindo-o-deploy)
   - [Problemas comuns](#problemas-comuns)
4. [Contas e cupons de teste](#contas-e-cupons-de-teste)
5. [Cenários da API simulada e falhas](#cenários-da-api-simulada-e-falhas)
6. [Variáveis de ambiente](#variáveis-de-ambiente)
7. [Comandos do projeto](#comandos-do-projeto)
8. [Lighthouse](#lighthouse-10)
9. [Cobertura de testes](#cobertura-de-testes-9-do-desafio)
10. [Documentação](#documentação)

## Sobre o projeto

**Stack:** React · TypeScript · TanStack Router · TanStack Query · Axios · Socket.IO · Tailwind CSS · shadcn/ui · MSW ·
Playwright · Lighthouse.

Não há backend: a API REST e os eventos Socket.IO são simulados **dentro do navegador** pelo MSW (um service
worker), com dados salvos no `localStorage` e cenários de falha determinísticos. Por isso a aplicação publicada é
um site estático (os arquivos do `dist/`) e funciona completa — login, carrinho, pagamento, pedidos e tempo real —
sem nenhum servidor além da hospedagem.

## Usando a aplicação publicada

1. Abra a URL pública. Na primeira visita o navegador registra a API simulada (leva um instante); os dados
   ficam salvos **só no seu navegador**.
2. Entre com uma das [contas de teste](#contas-e-cupons-de-teste) ou crie uma conta pelo cadastro.
3. Faça uma compra: catálogo → detalhe → "COMPRAR" → carrinho (cupom `DESCONTO10`) → "Conectar e finalizar" →
   conectar a carteira → "Confirmar compra" → revisão → "Confirmar e pagar" → recibo (~2 s depois).
4. **Painel de testes** (botão com o frasco, no canto inferior esquerdo): troca o cenário (lentidão, erros,
   pagamento recusado…), reseta os dados, muda preços ao vivo e derruba o socket para ver a reconexão.
5. Para começar do zero a qualquer momento: painel → "Resetar dados", ou abra `/?scenario=default`.

O roteiro completo de validação, item por item do enunciado, está em
[`docs/CHECKLIST-FINAL.md`](docs/CHECKLIST-FINAL.md).

## Tutorial de deploy na Vercel

O projeto já vem pronto para a Vercel:

| Peça | Para quê |
|---|---|
| [`vercel.json`](vercel.json) | Reescreve qualquer rota para o `index.html` (acesso direto e refresh em `/nfts/1`, `/checkout`…), sem reescrever o service worker do MSW (`mockServiceWorker.js`), os assets e o `robots.txt` |
| [`.env`](.env) | `VITE_ENABLE_MOCKS=true`: liga a API simulada no build |
| `pnpm-lock.yaml` + `packageManager` | A Vercel instala com o mesmo pnpm e as mesmas versões |

### Passo a passo pelo painel

1. Entre em [vercel.com](https://vercel.com) com a conta do GitHub.
2. **Add New… → Project** e escolha o repositório `nft-marketplace` (**Import**).
3. Em **Configure Project**, confira (a Vercel detecta quase tudo sozinha):

   | Campo | Valor |
   |---|---|
   | Framework Preset | `Vite` |
   | Root Directory | `./` |
   | Install Command | `pnpm install` |
   | Build Command | `pnpm build` |
   | Output Directory | `dist` |

4. Em **Environment Variables**, adicione `VITE_ENABLE_MOCKS` = `true` (Production e Preview). O `.env` do
   repositório já tem esse valor; deixar explícito na Vercel evita surpresa se o `.env` mudar.
5. Em **Settings → General → Node.js Version**, escolha **22.x** (o projeto pede Node 22+).
6. Clique em **Deploy**. Em ~1 minuto a Vercel mostra a URL (ex.: `https://nft-marketplace-xxxx.vercel.app`).
7. Copie a URL para o topo deste README ("Aplicação publicada").

A partir daí, cada push na `main` publica uma nova versão de produção, e cada pull request ganha uma URL de
pré-visualização própria.

### Alternativa: pela linha de comando

```bash
npx vercel login
```

```bash
npx vercel link
```

```bash
npx vercel env add VITE_ENABLE_MOCKS production
```

```bash
npx vercel --prod
```

`vercel link` liga a pasta ao projeto (cria um novo na primeira vez); no `env add`, responda `true`.

### Conferindo o deploy

Na URL pública, numa janela anônima:
- [ ] Refresh em `/nfts/1`, `/cart` e `/checkout` abre a tela certa (não dá 404).
- [ ] O Console do navegador mostra `[MSW] Mocking enabled` e o catálogo carrega.
- [ ] Login com `ana@example.com` / `Senha@123` e uma compra completa até o recibo.
- [ ] Painel de testes → "Emitir nft.updated" muda o preço do NFT 7 sem recarregar.
- [ ] Painel de testes → "Derrubar socket": o app reconecta sozinho.
- [ ] `/?scenario=slow` mostra os skeletons; `/?scenario=default` volta ao normal.

### Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| 404 ao recarregar uma rota interna | O `vercel.json` não foi lido: confira se ele está na raiz e se o Root Directory é `./`. |
| Telas de erro "Sem conexão" logo de cara | A API simulada não ligou. Confira se `VITE_ENABLE_MOCKS=true` estava definido **no build** (é lido na hora do build; mudou a variável → faça um novo deploy) e se `https://<url>/mockServiceWorker.js` abre como JavaScript. |
| Dados "estranhos" depois de testar cenários | Os dados ficam no seu navegador: painel → "Resetar dados" ou `/?scenario=default`. |
| Build falha na instalação | Selecione Node 22.x; se a versão do pnpm for o problema, adicione a variável `ENABLE_EXPERIMENTAL_COREPACK=1` para a Vercel usar exatamente o pnpm do `packageManager`. |

## Contas e cupons de teste

| E-mail | Senha | Observação |
|---|---|---|
| `ana@example.com` | `Senha@123` | Carteira principal (MetaMask, Ethereum) e secundária (Coinbase, Polygon) |
| `bruno@example.com` | `Senha@123` | Só a carteira principal |

Cupons: `DESCONTO10` (10%) e `EXPIRADO` (vencido). Contas novas podem ser criadas pelo cadastro.

## Cenários da API simulada e falhas

Escolha um cenário de três formas (trocar de cenário **reseta os dados** — entre de novo):
- pela URL: `https://<sua-url>/?scenario=slow` (fica salvo até trocar);
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

Na Vercel, a mesma variável vai em **Settings → Environment Variables** (ver o tutorial acima).

## Comandos do projeto

Para desenvolver, rodar os testes ou a auditoria na sua máquina (Node 22+ e pnpm 10; `corepack enable` instala o
pnpm certo). A API simulada funciona igual à da versão publicada.

```bash
pnpm install
```

```bash
pnpm dev
```

Os testes E2E precisam do Chromium do Playwright uma vez (`npx playwright install chromium`).

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

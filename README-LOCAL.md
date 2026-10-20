# Kurio — rodando em localhost

Guia para rodar o projeto **na sua máquina**: desenvolvimento, testes e auditoria. Para avaliar a versão publicada,
use o [`README.md`](README.md).

## Sumário

1. [Requisitos](#requisitos)
2. [Instalação e servidor de desenvolvimento](#instalação-e-servidor-de-desenvolvimento)
3. [Comandos](#comandos)
4. [Variáveis de ambiente](#variáveis-de-ambiente)
5. [Contas e cupons de teste](#contas-e-cupons-de-teste)
6. [Cenários da API simulada e falhas](#cenários-da-api-simulada-e-falhas)
7. [Tempo real à mão](#tempo-real-à-mão)
8. [Testes E2E (Playwright)](#testes-e2e-playwright)
9. [Auditoria Lighthouse](#auditoria-lighthouse)
10. [Problemas comuns em localhost](#problemas-comuns-em-localhost)

## Requisitos

- **Node 22+**
- **pnpm 10**: `corepack enable` instala a versão do campo `packageManager` do `package.json`.
- **Chrome ou Edge** para usar o app. O Chromium dos testes é instalado pelo Playwright (ver
  [Testes](#testes-e2e-playwright)).

Não há backend nem serviço privado: a API REST e o Socket.IO são simulados no navegador pelo MSW.

## Instalação e servidor de desenvolvimento

```bash
pnpm install
```

```bash
pnpm dev
```

Abra **http://localhost:5173**. A API simulada liga sozinha (variável `VITE_ENABLE_MOCKS=true` no `.env`) e os dados
ficam no `localStorage` do navegador. Para ver o build de produção, igual ao publicado:

```bash
pnpm build
```

```bash
pnpm preview
```

Ele sobe em **http://localhost:4173**.

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento com os mocks (http://localhost:5173) |
| `pnpm build` | Verifica tipos e gera o build de produção em `dist/` (com os mocks, como a demonstração) |
| `pnpm preview` | Serve o `dist/` em http://localhost:4173 |
| `pnpm typecheck` | TypeScript sem gerar arquivos |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier (com ordenação de classes do Tailwind) |
| `pnpm test:e2e` | Playwright: build + preview + testes em desktop e mobile |
| `pnpm test:e2e:update` | Regenera as baselines da regressão visual |
| `pnpm lighthouse` | Build + preview + Lighthouse (Início e Detalhe, mobile e desktop, 3×) → `lighthouse/RESULTS.md` |

## Variáveis de ambiente

| Variável | Padrão (`.env`) | Efeito |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Liga a API e o Socket.IO simulados (MSW) no dev, no preview e no build. Com `false`, o app chama `/api` de verdade (não existe backend neste desafio) e os mocks ficam fora do bundle. |

Para mudar só na sua máquina, crie um `.env.local` (ele não vai para o git).

## Contas e cupons de teste

| E-mail | Senha | Observação |
|---|---|---|
| `ana@example.com` | `Senha@123` | Carteira principal (MetaMask, Ethereum) e secundária (Coinbase, Polygon) |
| `bruno@example.com` | `Senha@123` | Só a carteira principal |

Cupons: `DESCONTO10` (10%) e `EXPIRADO` (vencido). Contas novas podem ser criadas pelo cadastro.

## Cenários da API simulada e falhas

Escolha um cenário de três formas (trocar de cenário **reseta os dados** — entre de novo):
- pela URL: `http://localhost:5173/?scenario=slow` (fica salvo até trocar);
- pelo **painel de testes** (botão com o frasco no canto inferior esquerdo), que também reseta os dados, muda
  preços ao vivo e derruba o socket;
- pela API de controle, no console do navegador:
  ```js
  fetch('/api/__mock/reset', { method: 'POST', body: JSON.stringify({ scenario: 'slow' }) })
  ```

Para **resetar** os dados: "Resetar dados" no painel, `http://localhost:5173/?scenario=default` ou
`POST /api/__mock/reset`.

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

## Tempo real à mão

No console do navegador, com a página aberta:

- Mudar o preço do Golden Beat #207 (edição 1/50):
  ```js
  fetch('/api/__mock/nft-update', { method: 'POST', body: JSON.stringify({ nftId: '7', editionId: 'ed-1-50', price: '1.5' }) })
  ```
- Esgotar a mesma edição:
  ```js
  fetch('/api/__mock/nft-update', { method: 'POST', body: JSON.stringify({ nftId: '7', editionId: 'ed-1-50', available: 0 }) })
  ```
- Derrubar o socket (o app reconecta em ~1 s):
  ```js
  fetch('/api/__mock/disconnect', { method: 'POST' })
  ```

No Console aparecem os quadros Socket.IO (`⬇ 42["nft.updated",…]`). Na aba Network → WS eles não aparecem: o socket
é simulado dentro da página (ver [`docs/API.md`](docs/API.md)).

## Testes E2E (Playwright)

Na primeira vez, instale o Chromium:

```bash
npx playwright install chromium
```

```bash
pnpm test:e2e
```

- O comando faz o build, sobe o preview na porta 4173 e roda os testes nos projetos **desktop** (1440×900) e
  **mobile** (390×844).
- Leva ~4 min. Hoje dá 162 aprovados e 6 pulados de propósito (casos só de desktop ou só de mobile).
- Cada teste parte do estado inicial: o reset é automático (`tests/e2e/fixtures.ts`).

Para rodar só uma área:

```bash
pnpm test:e2e checkout
```

Para ver o relatório HTML (traces e screenshots só das falhas):

```bash
npx playwright show-report
```

A tabela "requisito do §9 → arquivo de teste" está no [`README.md`](README.md#cobertura-de-testes-9-do-desafio).

**Regressão visual:**
- As baselines ficam em `tests/e2e/visual.spec.ts-snapshots/` e foram geradas no **Windows**. Em outro sistema as
  fontes são desenhadas de outro jeito; gere de novo antes de comparar:
  ```bash
  pnpm test:e2e:update
  ```

## Auditoria Lighthouse

Rodada oficial: 3× cada página e perfil (≈6 min). Ela reescreve o `lighthouse/RESULTS.md` e os relatórios
`*-mediana.html/json`.

```bash
pnpm lighthouse
```

Conferência rápida (1 rodada, um perfil; não altera o `RESULTS.md`):

```bash
pnpm lighthouse --runs=1 --profile=mobile
```

- Usa o Chromium do Playwright e o preview na porta 4174.
- Os relatórios de cada rodada ficam em `lighthouse/reports/`.
- Configuração em [`lighthouse/config.cjs`](lighthouse/config.cjs).

## Problemas comuns em localhost

| Sintoma | O que fazer |
|---|---|
| Depois de editar o código, a tela mostra a versão antiga | Recarregue sem cache (Ctrl+F5). |
| Uma classe nova do Tailwind "não pega" numa pasta nova | Reinicie o `pnpm dev`. |
| "Sem conexão com o servidor" logo de cara | O service worker do MSW não ligou: recarregue a aba. Se persistir, DevTools → Application → Service Workers → "Unregister" e recarregue. |
| Dados "estranhos" depois de testar cenários | Painel → "Resetar dados" ou `http://localhost:5173/?scenario=default`. |
| Os testes não pegam uma mudança recente | Se um `pnpm preview` antigo estiver aberto na porta 4173, o Playwright reaproveita esse servidor (com o build velho). Feche-o e rode `pnpm test:e2e` de novo. |
| `pnpm dlx` falha no Windows | Use `npx` no lugar. |

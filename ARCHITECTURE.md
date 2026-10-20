# Arquitetura

Marketplace de NFTs em React + TypeScript, com API e tempo real simulados no navegador (MSW).
Este documento explica **como as peças se encaixam e por quê**. Contratos detalhados: [`docs/API.md`](docs/API.md).
Inventário visual do Figma: [`design/SPEC.md`](design/SPEC.md).

Diretriz do projeto: **código simples e fácil de manter**. Há poucas abstrações e uma forma de fazer cada coisa. Não
há Redux nem Zustand:

| O quê | Onde fica |
|---|---|
| Dado remoto | TanStack Query |
| Estado de URL (filtros, cupom, modal de login) | TanStack Router |
| Sessão | A query `['session']` |

## 1. Camadas

```
rotas (src/routes)      finas: leem params/URL e compõem as features
  └─ features/*         telas e hooks de cada domínio (catálogo, nft, auth, conta, favoritos,
       │                 carrinho, checkout, pedidos) — useQuery/useMutation aqui
       └─ api/*         funções REST tipadas sobre um único axios (src/api/client.ts)
            └─ rede ──► MSW (src/mocks) responde no navegador, ligado por VITE_ENABLE_MOCKS
realtime/*              socket.io-client + aplicação dos eventos no cache do Query
lib/*                   money (big.js), queryKeys, queryClient, idempotency, images, error-hint…
components/*            UI compartilhada (shadcn adaptado, layout, campos de formulário)
```

**Regra:** componentes, hooks e axios **nunca** importam `src/mocks/`. O app fala só HTTP e Socket.IO. Trocar o
MSW por um backend real não muda uma linha da interface.

## 2. Estrutura de pastas

```
src/
  api/          client.ts (axios + ApiError + token/carrinho de visitante), types.ts (contratos), 1 arquivo por recurso
  features/
    catalog/    Início: hero, filtros (URL), grade, paginação, destaques
    nft/        detalhe, galeria, edições
    auth/       sessão, login/cadastro (modal por ?auth=), expiração
    account/    perfil, avatar, senha, carteiras
    favorites/  coração otimista
    cart/       carrinho, cupom, cotação, avisos de tempo real
    checkout/   pagamento, conexão de carteira simulada, revisão, pedido idempotente
    orders/     status do pedido e recibo
  realtime/     socket.ts (uma conexão por sessão) e use-realtime.ts (eventos → cache)
  routes/       arquivos de rota do TanStack Router (_auth/ = rotas privadas)
  mocks/        API simulada: db.ts, handlers/, realtime.ts (servidor Socket.IO), scenarios.ts
  lib/          utilidades sem React (exceto use-return-focus)
  components/   ui/ (shadcn), layout/, dev-panel.tsx (só com mocks)
tests/e2e/      Playwright: 1 arquivo por área + fixtures/helpers + baselines visuais
lighthouse/     config.cjs, run.mjs, RESULTS.md
```

## 3. Sessão
- **Token e consulta:** o token fica no `localStorage`. A query `['session']` (`GET /auth/session`) é a fonte da
  verdade de "quem está logado". Sem token, ela nem chama a API.
- **Rotas privadas** (`src/routes/_auth.tsx`): `beforeLoad` sem sessão manda para
  `/?auth=login&redirect=<url>`. Login e cadastro são um **modal sobre a página atual** (parâmetro `?auth=`).
- **Expiração:** um 401 numa requisição autenticada faz o axios emitir `session-expired`. O app então:
  - apaga o token e os dados privados;
  - fecha o socket;
  - avisa a pessoa e, se ela estava numa tela privada, abre o login guardando o caminho.

  No pagamento, o formulário fica salvo como rascunho no `sessionStorage` e volta preenchido depois do login.
- **Logout e troca de usuário:** `clearPrivateData` remove tudo que não é catálogo ou sessão. As chaves privadas
  levam o dono (`['cart', userId]`), então um usuário nunca vê o cache de outro.

## 4. Estado do carrinho
- **Dono do carrinho:**
  - visitante: um `guestCartId` (UUID no `localStorage`) enviado no header `X-Cart-Id`;
  - logado: o carrinho é da conta.
- **Login:** `POST /cart/merge` soma os itens do visitante ao carrinho da conta, respeitando o limite. O merge vem
  **antes** de limpar o cache, porque depois o app não saberia de quem era o carrinho.
- **A interface não calcula nenhum valor.** Subtotal, desconto, taxa e total vêm de `POST /quote`, refeita sempre
  que o carrinho muda. Toda conta com ETH usa `big.js` e strings decimais (`src/lib/money.ts`).
- **Cupom:** fica na URL (`/cart?cupom=`), sobrevive ao refresh e segue para `/checkout?cupom=`.

## 5. Cache, novas tentativas e invalidação
| Dado | `staleTime` | Atualização |
|---|---|---|
| Catálogo e detalhe | 30 s | `nft.updated` (detalhe na hora; listas buscadas de novo) |
| Sessão | 60 s | revalidada ao entrar em rota privada |
| Carrinho, cotação, pedido | 0 | invalidados por mutation e por eventos |
| Perfil, carteiras, favoritos | 30 s | invalidados depois de cada mutation |

- **Novas tentativas:** até 2, só em falha transitória (sem rede ou 5xx), nunca em 4xx. Mutations não repetem
  sozinhas. A exceção é o envio do pedido em falha de rede, que é seguro porque é idempotente.
- **Otimista (favoritos):** `onMutate` aplica a mudança, `onError` **desfaz aquela mudança** e avisa, e
  `onSettled` busca de novo. Desfazer a mudança, em vez de restaurar uma cópia, funciona mesmo quando a cópia não
  existia.
- **`placeholderData`:** nas listas, a página anterior fica na tela enquanto a nova carrega.

## 6. Tempo real e reconciliação com o REST
- **Transporte:** `socket.io-client` ⇄ MSW `ws.link` + `@mswjs/socket.io-binding`. Detalhes e limitações em
  [`docs/API.md` → Tempo real](docs/API.md#eventos-em-tempo-real-socketio).
- **Coerência no servidor:** toda mudança simulada passa por `updateNft()`, que grava no banco (o REST já
  responde o valor novo) e **depois** emite o evento com a `version` nova.
- **No app** (`useRealtime`):
  - ignora `eventId` repetido e `version` menor ou igual à já aplicada;
  - no detalhe, aplica a mudança na hora com `setQueryData`, só se a versão for maior que a do cache;
  - busca de novo no REST as listas, o carrinho e a cotação;
  - `order.updated` atualiza o pedido do dono e nunca volta um estado terminal para `pending`.
- **Reconexão:** eventos emitidos com o socket fora se perdem. Ao reconectar, o app invalida todas as queries
  ativas e o REST traz o estado atual. Enquanto um pedido está pendente, uma consulta a cada 10 s é a rede de
  segurança.
- **Avisos do carrinho:** nascem da diferença entre o carrinho novo e o anterior, não do evento. Um evento
  repetido nunca gera aviso duplicado.

## 7. Pedido e idempotência
1. **Revisão:** o pagamento valida o formulário, exige a carteira conectada e abre a revisão com a cotação atual.
   Se ela mudar enquanto a revisão está aberta, o diálogo mostra o antes → depois e pede nova confirmação.
2. **Envio:** `POST /orders` leva o header `Idempotency-Key`.
   - A chave sai do **conteúdo** do pedido (`src/lib/idempotency.ts`, no `sessionStorage`). Cliques repetidos e
     reenvios usam a mesma chave; mesma chave e mesmo corpo devolvem o mesmo pedido.
   - O servidor recalcula a cotação. Se o `quoteId` não bater, responde 409 `QUOTE_STALE`; sem estoque, 409
     `OUT_OF_STOCK`.
3. **Pedido criado:** nasce `pending` com **snapshot** (itens, valores, carteira), então mudar o preço depois não
   altera o recibo. Depois de ~2 s a "rede" responde `confirmed` (com hash e link de explorer fictícios) ou
   `rejected`.
4. **Confirmado:** saem do carrinho só os itens comprados e o estoque baixa.
5. **Resposta perdida (timeout):** o app reenvia com a mesma chave e recupera o mesmo pedido.

## 8. API simulada (MSW)
- **Ativação:** `VITE_ENABLE_MOCKS=true` (em `.env`, inclusive no build de demonstração). O import é dinâmico, então
  sem a variável os mocks ficam fora do bundle.
- **Banco:** `localStorage['mock-db']`, lido e gravado a cada requisição. O estado sobrevive ao refresh e é o
  mesmo entre abas. `SCHEMA_VERSION` descarta formatos antigos.
- **Cenários:** uma tabela em `src/mocks/scenarios.ts`.
  - Um handler `http.all('/api/*')` no topo (`applyScenario`) aplica latência e falhas genéricas por regras
    declarativas. Quando não há falha, devolve `undefined` e a requisição segue para o handler da rota.
  - Regras de negócio são flags lidas pelo handler.
  - São determinísticos: contadores na memória da aba e semente fixa.
- **Controle:** rotas `/api/__mock/*` (reset, cenários, `nft-update`, `replay`, `disconnect`, `connections`), usadas
  pelos testes e pelo **painel de testes** (botão com o frasco, só com mocks).
- **Service worker religado:** com a aba em segundo plano, o Chrome desliga o service worker ocioso.
  `src/mocks/browser.ts` liga de novo ao voltar.

## 9. Decisões de UX
- **Login como modal:** abre sobre a página atual (`?auth=login`); fechar não muda de página. Rota privada →
  login → volta para onde estava.
- **"Comprar":** põe a edição escolhida no carrinho e leva até ele, porque o pagamento parte do carrinho.
- **Mobile sem o header do site** (nenhum frame mobile tem):
  - a navegação é a barra inferior;
  - as telas internas têm "voltar + título".
- **Tablet (768–1023 px):** mantém o header com o menu ☰.
- **Erros:** todo erro de carregamento diz o motivo (sem conexão, servidor instável ou demora) e tem "Tentar
  novamente". Erros de formulário aparecem no campo, ligados por `aria-describedby`.
- **Botões fora do escopo:** "Em breve", com `aria-disabled` e uma dica acessível.
- **Hero:** troca de destaque a cada 6 s, pausa no hover ou no foco e tem botão de pausar. Respeita "reduzir
  movimento".

## 10. Desvios do Figma
A lista completa, com o porquê de cada desvio, está em [`design/SPEC.md` → "Desvios do Figma"](design/SPEC.md#desvios-do-figma-decididos-na-implementação)
e em "Substituições e lacunas". Em resumo:
- **Login:** modal sobre a página atual, em vez de sobre a Início.
- **Perfil e senha:** dois formulários.
- **Carteiras:** guardam só os dados da carteira.
- **Pagamento:**
  - sem os campos repetidos da conta;
  - carteiras cadastradas em cartões;
  - botão de conectar com os estados da conexão;
  - diálogo de revisão antes de enviar.
- **Estados sem frame:** pedido pendente e recusado.
- **Desenhos próprios:** avisos de tempo real no carrinho, conta no mobile e detalhe no tablet (galeria em cima).
- **Telas de 320 px:** as abas quebram linha.
- **Valores:** o resumo do Figma (8.92) não fecha com os itens; o app mostra a soma real da cotação.
- **Imagens:** artes convertidas de PNG (2 MB) para WebP (~13/40 KB).

## 11. Acessibilidade (ajustes além do layout)
- **Navegação e estrutura:** "Pular para o conteúdo"; foco visível em tudo; uma `<main>` por página; títulos em
  ordem; trilhas com `aria-current`.
- **Diálogos:** o foco fica preso enquanto estão abertos e volta a quem abriu ao fechar (`useReturnFocus`, para
  os que abrem sem trigger).
- **Anúncios (`aria-live`):** mutations (avisos), tempo real (carrinho), status do pedido e resultados do catálogo.
- **Estados:** sempre têm texto, além de cor e ícone ("Esgotada", "Pagamento recusado"…).
- **Nomes acessíveis:** contêm o texto visível (WCAG 2.5.3); a letra do avatar é decorativa.
- **Reflow:** nada rola na horizontal de 320 a 1440 px, nem em 200% de zoom (`tests/e2e/responsive.spec.ts`).
- **Verificação automática:** axe sem violações sérias em todas as telas (`tests/e2e/a11y.spec.ts`).

## 12. Performance
- **A tela não espera a API simulada:** o app renderiza na hora; só as chamadas à API (axios) e o socket esperam
  o MSW ligar (`src/lib/api-ready.ts`). Assim texto e layout aparecem enquanto o service worker registra.
- **Bundle inicial enxuto:**
  - code-splitting por rota (`autoCodeSplitting`);
  - modal de login, painel de testes e `socket.io-client` carregados sob demanda;
  - parâmetros de URL validados por funções simples (`src/lib/search-params.ts`), então o zod fica só nos
    formulários.
- **Imagens:**
  - WebP em 800/400 px com `srcset`/`sizes` (`src/lib/images.ts`);
  - `width`/`height` em todas as imagens (CLS ≈ 0);
  - `loading="lazy"` fora da primeira tela e `fetchpriority="high"` na imagem principal;
  - fonte pré-carregada.
- **Resultado:** [`lighthouse/RESULTS.md`](lighthouse/RESULTS.md).
  - Desktop: 98 em performance.
  - Mobile: ~73. A causa está explicada no próprio arquivo: SPA sem SSR + MSW no navegador, num celular
    simulado com CPU 4× mais lenta.
  - Acessibilidade, boas práticas e SEO: 100.

## 13. Limitações conhecidas
- **Socket:**
  - o transporte simulado é só WebSocket, no caminho `/realtime/`;
  - não aparece na aba Network do DevTools (os quadros aparecem no console do MSW);
  - o "servidor" vive na aba: mudanças feitas em outra aba chegam pelo REST, sem evento.
- **Baselines visuais:** geradas no Windows. Em outro sistema, gere de novo antes de comparar.
- **Fora do escopo do desafio:** busca global do header, "Criadores" e "Aprenda", favoritos como tela própria,
  login social e "Esqueceu a senha". Aparecem como "Em breve".
- **Deploy na Vercel:** ainda não feito (aguarda liberação). `vercel.json` já reescreve as rotas para o
  `index.html`.

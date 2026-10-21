# Checklist final de validação

Roteiro para testar a entrega inteira **na ordem do enunciado** (`docs/CHALLENGE.md`). Cada item diz o que fazer
e o que deve acontecer. Marque `[x]` ao conferir.

**Antes de começar**
- Abra a **URL pública** (https://nft-marketplace-ebon-delta.vercel.app) no Chrome, com o DevTools aberto
  (abas **Console**, **Network** e **Application**). Na máquina local o comportamento é o mesmo
  (ver "Rodar localmente" no `README.md`).
- Contas: `ana@example.com` e `bruno@example.com`, senha `Senha@123`.
- Cupons: `DESCONTO10` e `EXPIRADO`.
- Voltar ao estado inicial: painel de testes (botão com o frasco, canto inferior esquerdo) → "Resetar dados"; ou
  `?scenario=default` na URL.
- Mobile: DevTools → modo responsivo em **390 × 844**. Tablet: **768**.

---

## 0. Eliminatórios (§11): confira primeiro
- [ ] **Stack de verdade:**
  - React, TypeScript, TanStack Router, TanStack Query, Axios, Socket.IO, Tailwind, shadcn/ui, MSW, Playwright
    e Lighthouse aparecem no `package.json`;
  - cada um é usado de fato (ver `ARCHITECTURE.md` §1).
- [ ] **Fluxos funcionam:** compra e conta funcionam ponta a ponta, não são só telas (seções 3 a 6 abaixo).
- [ ] **Confirmação só vem da simulação:** a tela "Seus NFTs agora estão na sua carteira" só aparece quando a
  simulação responde `confirmed`. Com `?scenario=payment-rejected`, ela **nunca** aparece.
- [ ] **Isolamento entre usuários:**
  1. Ana põe itens no carrinho e favorita um NFT.
  2. Sai e entra como Bruno.
  3. Bruno não vê carrinho, favoritos, perfil, pedidos nem carteiras da Ana.
  4. A URL de um pedido da Ana mostra "Pedido não encontrado" para o Bruno.
- [ ] **Eventos passam pelo socket:** busque `useRealtime` em `src/realtime/use-realtime.ts`. Os eventos chegam
  por `socket.on(...)`. Nenhum componente importa `src/mocks/`.
- [ ] **Testes executáveis:** `pnpm test:e2e` termina verde (≈4 min). Hoje: **162 aprovados, 6 pulados de
  propósito**.

## 1. Escopo e Figma (§1, §3)
Compare cada tela com `design/screens/*.png`. Os desvios conscientes, com o porquê, estão em `design/SPEC.md` →
"Desvios do Figma".
- [ ] **Início (desktop):**
  - header, hero com destaque trocando a cada 6 s (pausa no hover e no botão);
  - filtros à esquerda, "NFT em destaque", abas, "Ordenar por", grade 3×3, paginação, promoções, blog e rodapé.
- [ ] **Início (mobile):** busca + botão de filtro, hero compacto com círculos dourados, grade de 2 colunas
  deslocada e a barra inferior com o botão central rebaixado (curva suave).
- [ ] **Detalhe:**
  - galeria (setas do teclado nas miniaturas, ampliar), nota e avaliações, edições (1/1, 1/10, 1/50, Aberta);
  - quantidade, total, "COMPRAR", "Favoritar", abas de detalhes e "Mais desta coleção";
  - no mobile: voltar, coração, barra fixa com Qtd/Total/Comprar.
- [ ] **Carrinho:** tabela (NFT · Preço · Edições · Total · lixeira), "Resumo da carteira" e "Colecionadores
  também viram". No mobile: cards e o resumo no fim.
- [ ] **Pagamento:** "Perfil do colecionador" à esquerda e "Seus NFTs" + valores + "Carteira e rede" + "Confirmar
  compra" à direita. No mobile: "Pagamento com carteira".
- [ ] **Confirmação:** modal com o ícone "Thank you", faixa ID/Data/Total/Carteira, itens, taxa, total e "Ver no
  Etherscan".
- [ ] **Login e cadastro:**
  - desktop: modal de 500 px com as abas "Entrar | Criar conta";
  - mobile: tela cheia com o logo grande.
- [ ] **Perfil e Carteiras:** menu "Meu perfil" à esquerda e formulários em 2 colunas.
- [ ] **Telas sem frame mobile** (perfil, carteiras, confirmação) também funcionam bem em 390 px.
- [ ] **Ações fora do escopo** (Criadores, Aprenda, Lista de interesse, login social, "Esqueceu a senha"…) mostram
  "Em breve" e não fingem que funcionam.

## 2. Catálogo e detalhe (§3)
- [ ] **Busca + filtros:** busque "Ape", escolha uma coleção, uma rede e uma faixa de preço → a URL guarda tudo.
  - Refresh → continua igual.
  - Voltar/avançar do navegador desfaz e refaz cada passo.
- [ ] **Mudar um filtro volta para a página 1.**
- [ ] **Ordenação** (preço ↑/↓, popular, recentes) e **abas** (Todos, Novos, Em alta) mudam a grade e a URL.
- [ ] **Busca sem resultado** → "Nenhum NFT encontrado" + "Limpar filtros".
- [ ] **URL inválida** (`/?page=abc&category=xyz`) → a tela abre normal, com os valores padrão.
- [ ] **Acesso direto e erros no detalhe:**
  - `/nfts/1` direto na barra abre o detalhe;
  - `/nfts/999` → "NFT não encontrado";
  - `/nao-existe` → página 404.
- [ ] **Edição esgotada:** aparece desabilitada com "Esgotada".
- [ ] **Limite de quantidade:** o "+" para no limite da edição (1/1 → 1; 1/50 → até 10).
- [ ] **Favoritos:**
  1. Deslogado, o coração abre o login sem sair da página.
  2. Logado, favorite no card e no detalhe e dê refresh → continua favoritado.

## 3. Carrinho (§3)
- [ ] **Visitante:** deslogado, "COMPRAR" em 2 NFTs → vai ao carrinho; "+"/"−" e lixeira funcionam; refresh mantém.
- [ ] **Merge no login:** entre como Ana com itens de visitante → os itens continuam no carrinho dela.
- [ ] **Cupom válido:** `DESCONTO10` → "(-) desconto"; a conta fecha: subtotal − desconto + taxa = total, sem
  números tipo `0.30000000004`.
- [ ] **Cupom com erro:** `XYZ` → "Este cupom não existe." e `EXPIRADO` → "Este cupom expirou.", os dois **no campo**.
- [ ] **Cupom na URL:** fica em `/cart?cupom=DESCONTO10`; refresh mantém e "Remover cupom" funciona.
- [ ] **Tempo real com o carrinho aberto:** no console, rode o comando abaixo. Aparece o aviso "O preço de
  Golden Beat #207 (1/50) mudou de 0.99 ETH para 1.50 ETH." e o resumo muda **sem refresh**.
  ```js
  fetch('/api/__mock/nft-update', { method: 'POST', body: JSON.stringify({ nftId: '7', editionId: 'ed-1-50', price: '1.5' }) })
  ```
- [ ] **Disponibilidade caindo:** mesmo comando com `available: 0` → "… esgotou." e "Conectar e finalizar" desabilita.

## 4. Pagamento e confirmação (§3)
- [ ] **Dados preenchidos:** vêm do perfil. Apague o nome e escreva `ana@` no e-mail → "Confirmar compra" mostra o
  erro em cada campo.
- [ ] **Carteira obrigatória:** "Confirmar compra" sem conectar → aviso e o foco vai ao botão "Conectar".
- [ ] **Conexão:** conectar → "Carteira conectada: 0xA91F…E82C". Trocar a carteira (Principal/Reserva) ou o app
  pede nova conexão. A rede acompanha a carteira.
- [ ] **Recusa:** `?scenario=wallet-reject` (entre de novo) → "A conexão foi recusada na carteira." + "Tentar novamente".
- [ ] **Desconexão:** `?scenario=wallet-disconnect` → ao confirmar, "A carteira desconectou…" e nenhum pedido criado.
- [ ] **Revisão:** "Revise seu pedido" mostra os itens, o cupom, a taxa e o total da cotação atual.
- [ ] **Preço muda com a revisão aberta:** mude o preço pelo console → aparece "Os valores mudaram…" com o
  antes → depois, e só dá para seguir com "Aceitar os novos valores" + confirmar de novo.
- [ ] **Preço muda no servidor:** `?scenario=price-change-checkout` → ao confirmar, o servidor recusa (409) e a
  revisão pede nova confirmação.
- [ ] **Esgota no servidor:** `?scenario=sold-out-checkout` → "esgotou" + "Voltar ao carrinho", sem pedido.
- [ ] **Clique repetido:** vários cliques rápidos em "Confirmar e pagar" → **1 pedido só** (Application → Local
  Storage → `mock-db` → `orders`).
- [ ] **Timeout:** `?scenario=order-timeout` → a 1ª resposta "se perde", o app reenvia com a mesma chave e o
  resultado é **1 pedido**.
- [ ] **Pendente → confirmado:** "Confirmando seu pedido" (girando) e, ~2 s depois, sozinho, a confirmação, com
  hash e "Ver no Etherscan" (link simulado).
- [ ] **Refresh no meio:** recarregue com o pedido pendente → continua acompanhando e chega ao confirmado.
- [ ] **Recusa do pagamento:** `?scenario=payment-rejected` → "Pagamento recusado" com o motivo; "Voltar ao
  carrinho" mostra os itens lá.
- [ ] **Só o comprado sai do carrinho:** ponha outro item no carrinho enquanto o pedido está pendente → depois de
  confirmado, só os itens comprados saíram.
- [ ] **Recibo congelado:** depois de confirmado, mude o preço pelo console e recarregue o recibo → os valores
  **não** mudam (snapshot).

## 5. Conta e sessão (§3)
- [ ] **Cadastro:**
  - campos vazios ou senha curta → erros no cliente;
  - e-mail já usado (`ana@example.com`) → erro no campo;
  - conta nova → entra logada.
- [ ] **Login:** senha errada → "E-mail ou senha incorretos.". Login certo fecha o modal e mantém a página.
- [ ] **Rotas privadas:** `/account/profile` deslogado → login → volta para o perfil.
- [ ] **Refresh logado** → continua logado.
- [ ] **Sessão vencendo na navegação:** no `mock-db`, ponha `sessions[].expiresAt` no passado e clique em algo →
  "Sua sessão expirou. Entre novamente." e o login volta para a mesma tela.
- [ ] **Sessão vencendo no checkout:** escreva uma observação, vença a sessão e clique em conectar → login → volta
  ao pagamento com a observação preenchida.
- [ ] **Logout e troca de usuário:** não sobra nada do usuário anterior (ver item 0). O socket reconecta como
  visitante.
- [ ] **Perfil:** mude o nome → "Perfil salvo." e refresh mantém. Usuário já usado → erro no campo.
- [ ] **Avatar:** envie uma imagem → aparece e persiste; "Remover" funciona; um arquivo que não é imagem é recusado.
- [ ] **Senha:**
  - a atual errada dá erro no campo;
  - trocada, a senha nova vale no próximo login;
  - senha nova igual à atual é recusada.
- [ ] **Carteiras:**
  - endereço inválido é barrado;
  - a secundária nova persiste após refresh;
  - "Igual à carteira principal" copia os dados.
- [ ] **Senhas nunca em claro:** no `mock-db`, os usuários têm `passwordHash` + `passwordSalt`, nunca a senha.

## 6. Integração e estado (§4, §5)
- [ ] **Contratos tipados:** estão em `src/api/types.ts` e documentados em `docs/API.md`, com erros
  `code` + `reason`, idempotência e eventos.
- [ ] **Estados de tela:** carregando (skeleton), vazio, erro com "Tentar novamente", sucesso e atualização em
  segundo plano (a grade fica esmaecida enquanto a nova página carrega).
- [ ] **Otimista com rollback:** `?scenario=favorites-fail`, logado, clique num coração → ele acende, volta e
  aparece "Não foi possível favoritar…".
- [ ] **Respostas fora de ordem:** `?scenario=out-of-order` → busque "Golden" e logo "Ape": no fim aparecem só
  os Ape.
- [ ] **Política documentada:** cache, novas tentativas e invalidação em `docs/API.md` → "Política de cache" e em
  `ARCHITECTURE.md` §5.

## 7. Mocking e cenários (§6)
Painel de testes: escolha o cenário → "Aplicar cenário" (reseta os dados). Lista completa no README.
- [ ] `slow` → skeletons por 2 s em Início, Detalhe, Carrinho e Pagamento.
- [ ] `variable-latency` → respostas com tempos diferentes, mas a tela sempre termina certa.
- [ ] `offline` → "Sem conexão com o servidor…" + "Tentar novamente".
- [ ] `server-error` → "O servidor está instável…" depois de ~4 s. "Tentar novamente" carrega.
- [ ] `empty` → "Ainda não há NFTs à venda…".
- [ ] `unauthorized` → ao entrar, o token é recusado e você continua deslogado.
- [ ] `session-expired` → ao entrar, "Sua sessão expirou. Entre novamente.".
- [ ] `register-conflict` → cadastro com e-mail novo dá "Este e-mail já está cadastrado.".
- [ ] **Determinismo:** repita o mesmo cenário duas vezes → mesmo resultado.
- [ ] **Persistência e reset:** refresh mantém carrinho e pedidos; "Resetar dados" volta tudo ao estado inicial.
- [ ] **Mocks por configuração:** `.env` tem `VITE_ENABLE_MOCKS=true`. `pnpm build && pnpm preview` (porta 4173)
  funciona igual, com mocks.

## 8. Tempo real (§7)
- [ ] **Quadros Socket.IO:** no Console aparecem as linhas do MSW com `⬇ 42["nft.updated",…]`. Não aparece em
  Network → WS: o socket é simulado dentro da página (ver `docs/API.md`).
- [ ] **Preço ao vivo:** com o detalhe `/nfts/7` e o catálogo abertos, "Emitir nft.updated" no painel (ou o
  `fetch` do item 3) muda o preço sem refresh.
- [ ] **Reconexão:** "Derrubar socket" no painel → reconecta sozinho (~1 s) e busca de novo o que está na tela.
- [ ] **Eventos privados:** `order.updated` só chega ao dono. Logado como Bruno, um pedido da Ana não aparece.
- [ ] **Duplicados e antigos:** coberto em `tests/e2e/realtime.spec.ts`, com reenvio pelo `/api/__mock/replay`.

## 9. Testes (§9)
- [ ] `pnpm test:e2e` → verde nos projetos desktop e mobile.
- [ ] `npx playwright show-report` → relatório HTML. Traces e screenshots só das falhas.
- [ ] A tabela "Cobertura de testes" do README liga cada item do §9 a um arquivo.
- [ ] **Regressão visual:**
  - as 8 baselines estão em `tests/e2e/visual.spec.ts-snapshots/`;
  - mude uma cor em `src/index.css` e rode `pnpm test:e2e visual` → falha mostrando a diferença;
  - desfaça a mudança.

## 10. Acessibilidade (§8)
- [ ] **Só teclado, do Início ao recibo:**
  - o 1º Tab é "Pular para o conteúdo";
  - o foco é sempre visível;
  - nos diálogos o foco fica preso, e o Esc fecha devolvendo o foco a quem abriu.
- [ ] **Erros de formulário:** são lidos junto do campo (leitor de tela ou DevTools → Accessibility).
- [ ] **Avisos anunciados:** mudança de preço no carrinho, status do pedido e resultados do catálogo
  (`aria-live`).
- [ ] **Larguras:**
  - 320, 390, 768, 1024 e 1440 px: nenhuma tela rola na horizontal;
  - no tablet o detalhe fica com a galeria em cima.
- [ ] **Zoom de 200%** numa janela de ~1280 px: nada fica cortado.
- [ ] **Movimento reduzido** (Windows → Acessibilidade → Efeitos de animação desligados): o hero não troca sozinho.

## 11. Performance e Lighthouse (§10)
- [ ] `pnpm lighthouse` (≈6 min) → `lighthouse/RESULTS.md` atualizado. Mostra a mediana de 3 rodadas, LCP/CLS/TBT,
  versões e condições. Os relatórios HTML/JSON da rodada mediana ficam em `lighthouse/reports/`.
- [ ] **Resultado atual:**

  | Categoria | Desktop (Início/Detalhe) | Mobile (Início/Detalhe) |
  |---|---|---|
  | Performance | 98 / 98 | 72 / 74 |
  | Acessibilidade, Boas práticas e SEO | 100 | 100 |

  A performance mobile abaixo de 90 está justificada no `RESULTS.md`: SPA sem SSR + MSW no navegador, num
  celular simulado com CPU 4× mais lenta.
- [ ] **Imagens:** em Network → Img, as artes são `.webp` (~13 KB nos cards, ~40 KB no detalhe).

## 12. Entrega (§12)
- [ ] **Clone limpo:** `git clone` numa pasta nova → `pnpm install`, `pnpm build`, `pnpm test:e2e` (já conferido:
  162 aprovados).
- [ ] **Comandos:** README com setup, variável, contas, cenários (escolher, resetar, reproduzir falhas) e todos os
  comandos (`dev`, `build`, `preview`, `typecheck`, `lint`, `test:e2e`, `lighthouse`).
- [ ] **Documentação:**
  - `ARCHITECTURE.md`: sessão, carrinho, cache, reconciliação REST ↔ Socket.IO, idempotência, mocks, UX, desvios,
    acessibilidade, limitações;
  - `docs/API.md`: contratos REST e eventos.
- [ ] ⚠️ **Deploy público (obrigatório no §12):** a URL pública está no topo do README e corresponde ao último
  commit da `main`. Nela:
  - refresh em `/nfts/1`, `/cart` e `/checkout` abre a tela certa;
  - uma compra completa termina no recibo;
  - a mudança de preço pelo painel aparece sem recarregar;
  - "Derrubar socket" reconecta sozinho.

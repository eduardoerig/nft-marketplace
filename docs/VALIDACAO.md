# Checklist de validação (para você, não para o agente)

Use depois de cada passo para conferir **com seus próprios olhos** o que o agente entregou.
Se algum item falhar, peça: `passo NN: ajuste — <o que está errado>`.

## Sempre, em todo passo (2 min)
- [ ] `git log -1 --format='%an %ae%n%B'` → autor `eduardoerig`, mensagem `passo NN: ...`, **nenhuma menção a Claude**.
- [ ] O agente mexeu só no que o passo pedia (`git show --stat HEAD`). Arquivos estranhos = pergunte por quê.
- [ ] `pnpm typecheck && pnpm lint` passam (a partir do passo 02).
- [ ] `pnpm test:e2e` passa (a partir do passo 05).
- [ ] `grep -rn "mocks/" src --include=*.tsx --include=*.ts | grep -v "^src/mocks\|main.tsx"` → **vazio**
      (componentes nunca importam mocks — eliminatório).
- [ ] O `CLAUDE.md` foi marcado com o passo concluído.

## Ao abrir o app (`pnpm dev`)
Abra o DevTools: aba **Network** (requisições `/api/...` devem aparecer com "from service worker")
e aba **Console** (sem erros vermelhos).

---

## 01 — Design
- [x] `design/SPEC.md` tem cores em hex, nome das fontes, tamanhos e espaçamentos.
- [x] Abra 2–3 cores no Figma e compare com o SPEC.
- [ ] `design/screens/` tem 15 imagens e elas batem com os frames.
- [ ] `public/` tem imagens dos NFTs, logo e fontes.

## 02 — Scaffold
- [ ] `pnpm i && pnpm dev` abre uma página.
- [ ] O botão e o input de teste têm a cor, fonte e arredondamento do Figma.
- [ ] Existe `pnpm-lock.yaml` versionado.

## 03 — Rotas e layout
- [ ] Digite cada URL na barra: `/`, `/nfts/1`, `/cart`, `/login`, `/register`, `/checkout`,
      `/account/profile`, `/account/wallets`, `/orders/1` — todas abrem.
- [ ] `/qualquer-coisa` mostra a página 404.
- [ ] Header e footer parecem com o Figma em tela cheia e em 390px (DevTools → modo celular).
- [ ] No celular, o menu abre, `Tab` fica preso dentro dele e `Esc` fecha.

## 04 — Contratos
- [ ] Leia `src/api/types.ts`: preços são `string`, não `number`.
- [ ] `docs/API.md` lista todos os endpoints com erros possíveis.
- [ ] Nenhum arquivo em `src/api/` tem dados falsos (só chamadas Axios).

## 05 — Mocks base
- [ ] Network mostra `/api/nfts` respondido pelo service worker.
- [ ] Mude algo, dê refresh: o estado continua. Chame o reset: volta ao início.
- [ ] Abra `src/mocks/fixtures/` e veja ~60 NFTs e 2 usuários; senhas **não** estão em texto puro no db.
- [ ] `pnpm test:e2e` abre relatório HTML (`pnpm exec playwright show-report`).

## 06 — Início e catálogo
- [ ] Busque algo, filtre por categoria e preço, ordene, vá para a página 2.
- [ ] A URL muda a cada ação. Dê **refresh**: tudo continua igual.
- [ ] Botão **voltar** do navegador desfaz passo a passo.
- [ ] Mudar um filtro na página 3 volta para a página 1.
- [ ] Busca sem resultado mostra mensagem de vazio.
- [ ] Compare com `design/screens/` (desktop e celular).

## 07 — Detalhe
- [ ] Abra um NFT direto pela URL (nova aba). Funciona.
- [ ] `/nfts/nao-existe` mostra "não encontrado".
- [ ] Edição esgotada aparece desabilitada **com texto**, não só cor cinza.
- [ ] O `+` da quantidade para no limite.

## 08 — Login e sessão
- [ ] Cadastre um e-mail novo → funciona. Cadastre `ana@example.com` de novo → erro de conflito no campo.
- [ ] Senha errada → mensagem de erro.
- [ ] Deslogado, abra `/account/profile` → vai ao login → após logar volta para o perfil.
- [ ] Refresh logado → continua logado.
- [ ] Logue como Ana, depois saia e logue como Bruno: **nada da Ana aparece** (eliminatório).

## 09 — Perfil e carteiras
- [ ] Mude o nome e o avatar, refresh → ficou salvo.
- [ ] Troque a senha com a senha atual errada → erro no campo certo.
- [ ] Carteira com endereço inválido → erro; válido → salva e continua após refresh.

## 10 — Favoritos
- [ ] Favorite, refresh → continua favoritado.
- [ ] Com `?scenario=favorites-fail`, o coração acende e **volta** sozinho com aviso de erro.

## 11 — Carrinho
- [ ] Deslogado, adicione 2 NFTs. Faça login → os itens continuam.
- [ ] Altere quantidade, remova um item, refresh → estado mantido.
- [ ] Cupom `DESCONTO10` aplica; `EXPIRADO` e `XYZ` dão erro com mensagem.
- [ ] Os valores fecham na conta (subtotal − desconto + taxa = total), sem números tipo `0.30000000004`.

## 12 — Tempo real
- [ ] DevTools → **Console**: aparecem as linhas do MSW com os quadros Socket.IO (`⬇ 42["nft.updated",…]`).
      (Não aparece em Network → WS: o socket é simulado dentro da página, sem rede real — ver docs/API.md.)
- [ ] Com o Golden Beat #207 no carrinho, dispare a mudança de preço pelo console:
      `fetch('/api/__mock/nft-update', { method: 'POST', body: JSON.stringify({ nftId: '7', editionId: 'ed-1-50', price: '1.5' }) })`
      → aparece aviso e o resumo muda **sem refresh**. Faça o mesmo com o detalhe `/nfts/7` e com o catálogo abertos.
- [ ] Desconexão: `fetch('/api/__mock/disconnect', { method: 'POST' })` → o app reconecta sozinho (≈1 s).
- [ ] Confira no código: o evento chega pelo `socket.io-client` (nada de chamar o cache direto do mock — eliminatório).

## 13 — Pagamento
Preparação: entre como `ana@example.com`, ponha 2 NFTs no carrinho e clique em "Conectar e finalizar".
- [ ] Os dados do colecionador vêm preenchidos do perfil. Apague o nome e escreva `ana@` no e-mail →
      "Confirmar compra" mostra o erro embaixo de cada campo.
- [ ] "Confirmar compra" sem conectar → aviso "Conecte a carteira…" e o foco vai para o botão de conectar.
- [ ] Conectar → "Carteira conectada: 0xA91F…E82C". Trocar de carteira ou de app volta a pedir conexão.
- [ ] `?scenario=wallet-reject` (reseta os dados: entre de novo) → "A conexão foi recusada na carteira." + "Tentar novamente".
- [ ] `?scenario=wallet-disconnect` → ao confirmar, "A carteira desconectou…" e nenhum pedido é criado.
      Volte com `?scenario=default`.
- [ ] Revisão: itens, cupom, taxa e total iguais aos do carrinho. Com a revisão aberta, mude o preço pelo console
      (`/api/__mock/nft-update`, ver passo 12) → aparece "Os valores mudaram…" com antes → depois e o botão
      vira "Aceitar os novos valores".
- [ ] Clique várias vezes seguidas em "Confirmar e pagar" → **1 pedido só** (DevTools → Application →
      Local Storage → `mock-db` → `orders`).
- [ ] Cupom: aplique `DESCONTO10` no carrinho → "Conectar e finalizar" leva o cupom (`/checkout?cupom=DESCONTO10`).
- [ ] Sessão expirada no meio: escreva uma observação, vença a sessão no `mock-db` (`sessions[].expiresAt` no
      passado) e clique em conectar → login → volta ao pagamento com a observação preenchida.

## 14 — Status e recibo
- [ ] Compra completa: catálogo → detalhe → carrinho → pagamento → modal "Confirmando seu pedido" (girando)
      → ~2 s depois, sozinho, "Seus NFTs agora estão na sua carteira" (layout do Figma: ID da transação, data,
      total, carteira, itens, taxa, total, "Ver no Etherscan").
- [ ] Refresh enquanto pendente → continua no mesmo pedido e chega ao "confirmado".
- [ ] `?scenario=payment-rejected` → "Pagamento recusado" com o motivo; "Voltar ao carrinho" mostra os itens lá.
- [ ] `?scenario=order-timeout` → a confirmação demora ~1 s a mais (o app reenviou), mas termina com **1 pedido só**.
- [ ] Depois de confirmado, mude o preço do NFT (console, `/api/__mock/nft-update`) e recarregue: o recibo **não muda**.
- [ ] Só os itens comprados saíram do carrinho (ponha outro item no carrinho enquanto o pedido está pendente: ele fica).
- [ ] Fechar o modal (X, Esc ou clique fora) volta ao início; a URL do pedido continua abrindo o recibo.
- [ ] Entre como `bruno@example.com` e abra a URL do pedido da Ana → "Pedido não encontrado".
- [ ] Leitor de tela: ao confirmar, anuncia "Pagamento confirmado." (região `role=status`).

## 15 — Cenários de rede
Tabela completa de cenários em `docs/API.md` → "Cenários da API simulada".
- [ ] Botão com o frasco (canto inferior esquerdo) abre o **painel de testes**: escolher cenário + "Aplicar cenário"
      recarrega a página no cenário novo; "Resetar dados" volta ao estado inicial; "Emitir nft.updated" muda um
      preço ao vivo; "Derrubar socket" e o app reconecta.
- [ ] `slow` → skeletons no catálogo, no detalhe, no carrinho e no pagamento.
- [ ] `server-error` → "Não foi possível carregar os NFTs." + "O servidor está instável…" (~4 s) → "Tentar novamente" carrega.
- [ ] `offline` → "Sem conexão com o servidor…" em vez dos dados.
- [ ] `empty` → "Nenhum NFT encontrado / Ainda não há NFTs à venda…".
- [ ] `out-of-order` → busque "Golden" e logo depois "Ape": no fim aparecem só os Ape.
- [ ] `register-conflict` → cadastro com e-mail novo dá "Este e-mail já está cadastrado." no campo.
- [ ] `session-expired` → entrar mostra "Sua sessão expirou. Entre novamente."; `unauthorized` → continua deslogado.
- [ ] `price-change-checkout` / `sold-out-checkout` → ver passo 13 (revisão mostra a mudança / esgotou).
- [ ] Repita um cenário duas vezes: o resultado é o mesmo (determinístico).

## 16 — Testes
- [ ] `pnpm test:e2e` verde em desktop e mobile (≈4 min). Depois: `npx playwright show-report` abre o relatório HTML.
- [ ] Tabela no README ("Cobertura de testes") liga cada item do §9 a um arquivo — confira se nenhum falta.
- [ ] Regressão visual: abra `tests/e2e/visual.spec.ts-snapshots/` e confira as 8 imagens (Início, Detalhe,
      Carrinho, Pagamento × desktop/mobile). Mude uma cor em `src/index.css`, rode `pnpm test:e2e visual` → falha
      com a diferença no relatório; desfaça a mudança.
- [ ] Teclado (sem mouse): Tab na Início → 1º foco é "Pular para o conteúdo"; Enter no "Entrar" abre o login com o
      foco no e-mail, Tab não sai do diálogo e Esc fecha **devolvendo o foco** ao "Entrar".

## 17 — Qualidade
- [ ] Use o app só com `Tab`/`Enter`/`Esc`: dá para comprar sem mouse, foco sempre visível (contorno dourado).
- [ ] DevTools → modo responsivo em 320, 390, 768, 1024 e 1440: nenhuma tela rola na horizontal. No tablet (768) o
      detalhe mostra a galeria em cima e as informações embaixo.
- [ ] Zoom do navegador em 200% (Ctrl +) numa janela de ~1280 px: nada cortado, só rolagem vertical.
- [ ] DevTools → Network → Img: as artes são `.webp` (~13 KB nos cards, ~40 KB no detalhe), não PNG de 2 MB.
- [ ] `pnpm lighthouse` (alguns minutos) → `lighthouse/RESULTS.md` com as medianas; o que ficar abaixo da meta
      (90/95/95/90) está justificado no próprio arquivo.
- [ ] Opcional: extensão axe DevTools em qualquer tela → sem problemas "serious"/"critical" (os testes já checam).

## 18 — Entrega
- [ ] Clone o repo numa pasta nova e siga **só** o README: tudo funciona.
- [ ] `ARCHITECTURE.md` explica sessão, carrinho, cache, tempo real e desvios do Figma.
- [ ] URL da Vercel: refresh em `/nfts/<id>` funciona, compra completa funciona, evento de preço funciona.

---

## Itens eliminatórios (confira antes de entregar)
- [ ] Toda a stack obrigatória é usada de verdade (Router, Query, Axios, Socket.IO, Tailwind, shadcn, MSW, Playwright, Lighthouse).
- [ ] Fluxos funcionam de verdade, não só visual.
- [ ] Compra só é confirmada pela resposta do mock.
- [ ] Nenhum dado de um usuário aparece para outro.
- [ ] Eventos passam pelo socket.io-client, nunca direto na UI.
- [ ] `pnpm test:e2e` executa e passa.

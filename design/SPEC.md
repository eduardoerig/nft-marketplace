# Design spec — Kurio (NFT Marketplace)

Extraído do Figma `5Ma6UpJeqdO7vTTFPduSPB` (cópia do arquivo do desafio). Este diretório substitui
consultas ao Figma nos próximos passos:

| Arquivo | Conteúdo |
|---|---|
| `design/SPEC.md` | Este documento: tokens, mapa de rotas, inventário, assets |
| `design/screens/*.png` | Render de cada frame (escala 1) — alvo visual |
| `design/outlines/*.txt` | Árvore de cada frame: tamanhos, cores, fontes, raios, gaps/paddings e textos |
| `design/figma-variables.json` | Variáveis do Figma (cores e estilos de texto nomeados) |
| `design/assets.json` | Manifesto dos assets baixados (nó de origem e onde são usados) |

Como ler um outline: `frame "Nome" 370x40 fill=#hex stroke=#hex 1px r=3 row gap=10 pad=t/r/b/l`;
textos trazem `[família peso tamanho/line-height]` e o conteúdo entre aspas.

## Tokens

### Cores
Tema único escuro (marrom + laranja). Nomes das variáveis do Figma entre parênteses.

| Token sugerido | Hex | Uso |
|---|---|---|
| `background` (`color/ink`) | `#140D0A` | Fundo das páginas; texto sobre botões laranja |
| `card` (`color/surface-card`) | `#241612` | Cards, sidebar de filtros, modais, footer |
| `card-raised` | `#2F1D15` | Botões redondos (voltar, favoritar, +/−), fim dos gradientes de card mobile |
| `surface-dark` (`color/surface-dark`) | `#38220F` | Faixa do footer (logo / contato) |
| `border` (`color/border`) | `#3F2319` | Bordas de inputs, divisores, botões sociais |
| `border-soft` (`color/border-soft`) | `#55321F` | Divisores secundários, "−" desabilitado |
| `primary` (`color/primary`) | `#D28A4C` | Botões, badges, sublinhado ativo, input em foco |
| `accent` (`color/text-accent`) | `#E89B55` | Preços, link ativo, valores em destaque |
| `muted` (`color/secondary`) | `#B39463` | Placeholders, ícones de select |
| `foreground-secondary` (`color/text-secondary`) | `#CFB28C` | Texto de apoio, descrições |
| `foreground` (`color/foreground`) | `#F5F1EB` | Texto principal |
| `foreground-strong` (`color/text-primary`) | `#F7F3EC` | Variável definida; quase igual a `foreground` |
| `destructive` | `#F0805F` | Asterisco de campo obrigatório; usar também para erros |
| `background-elevated` (`color/background-elevated`) | `#FBFBFB` | Só em máscaras do Figma; não aparece na UI |

Gradientes: botões grandes mobile (`Comprar NFT`, `Conectar e finalizar`, `Confirmar compra`) usam
linear `#D28A4C → #D28A4CCC` (pílula 60px, raio 40); cards mobile `#241612 → #2F1D15`;
botão central da tab bar `#D28A4C66 → #D28A4C`.
Cores de marca só nos ícones sociais (Google/Facebook) — vêm dentro dos SVGs.

### Tipografia
- Família única: **Roboto Mono** (400, 500, 700). Fonte variável local em
  `public/fonts/roboto-mono-latin.woff2` (subset latin, cobre português). Licença OFL (Google Fonts).
- `font-display: swap`. Fallback: `ui-monospace, SFMono-Regular, Menlo, monospace`.

| Estilo | Tamanho / line-height | Peso | Onde |
|---|---|---|---|
| Display | 43 / 70 | 700 | Título do hero desktop (caixa alta) |
| H-section | 28 / auto | 700 | "Diário da Cunhagem" |
| H1 | 24 / auto | 700 | Nome do NFT no detalhe, títulos de página |
| H-mobile | 20 / 16 | 700 | Título de tela mobile ("Carrinho de NFTs") |
| H3 | 18 / 16–24 | 700 | Títulos de bloco (Coleções, Resumo da carteira) |
| H4 | 17 / 16 | 700 | Títulos de formulário ("Perfil do colecionador") |
| Body-lg | 16 / 16–20 | 400/500/700 | Nav, botões, preços |
| Body | 15 / 15–16 | 400 | Labels de input, nomes nos cards |
| Body-list | 15 / 40 | 400 (+700 contagem) | Itens da lista de filtros |
| Body-sm | 14 / 16–24 | 400 | Inputs, descrições, breadcrumb (700) |
| Logo | 14 / auto, letter-spacing 10% | 700 | "KURIO" |
| Caption | 13 / 16–22 | 400/500 | Botões sociais, divisor "Ou continue com" |
| Small | 12 / 14–16 | 500/700 | Blog cards, "Taxa estimada" |
| Tiny | 10 / auto | 500 | Contador do badge do carrinho |
| Micro | 9 / auto, ls 0.1 | 700 | Pílula "METAMASK · WALLETCONNECT · COINBASE" |

### Espaçamento, raios e sombras
- Container desktop: largura **1200px** centralizada; padding da página `24px 120px` em 1440.
  Seções da Início separadas por **96px**. Grid de cards: 3 colunas de 258px, gap 34px; sidebar 310px + gap 48px.
- Escala de gaps mais usada: 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48 → usar a escala padrão do Tailwind.
- Mobile: frames com 414px de largura e padding lateral **28px** (o `r=40` dos frames mobile é a moldura do aparelho — ignorar).
- Raios: inputs `3px`; botões desktop `5–6px`; blog cards `8px`; cards de NFT mobile `14–20px`;
  hero/imagem principal `24px`; inputs e botão "Entrar" mobile `10px`; botões de checkout mobile
  `40px` (pílula); botões circulares `9999px`.
- Sombras:
  - `shadow-card`: `0 6px 20px #0A060473` (cards mobile)
  - `shadow-soft`: `0 4px 12px -2px #140D0A26`
  - `shadow-overlay`: `0 0 40px #0A060473` (modais) · tab bar mobile: `0 -10px 30px #0A060473`
- Bordas: 1px `border` (`#3F2319`) é o padrão. Input em foco/ativo: 1px `primary`.
  Sublinhado de aba/nav ativo: 3px `primary`. Modais têm uma faixa inferior de 10px `primary`.

### Breakpoints observados
Só existem frames em **1440** (desktop) e **414** (mobile). Os requisitos pedem 390/768/1440:
- `< 768`: layout mobile (tab bar inferior, cards em 2 colunas, telas de tela cheia).
- `768–1199`: layout desktop com grid de 2 colunas e sidebar de filtros recolhida em `Sheet` (adaptação, não desenhada).
- `≥ 1200`: layout desktop do Figma.

## Mapa frame → rota

| Frame | Node | Screenshot | Rota |
|---|---|---|---|
| Desktop / Início | `2:2` | `desktop-inicio.png` | `/` |
| Mobile / Início | `14:5226` | `mobile-inicio.png` | `/` |
| Desktop / Detalhes do NFT | `10:244` | `desktop-detalhe.png` | `/nfts/$nftId` |
| Mobile / Detalhes do NFT | `15:5536` | `mobile-detalhe.png` | `/nfts/$nftId` |
| Desktop / Carrinho de NFTs | `11:1278` | `desktop-carrinho.png` | `/cart` |
| Mobile / Carrinho de NFTs | `16:360` | `mobile-carrinho.png` | `/cart` |
| Desktop / Pagamento | `11:2862` | `desktop-pagamento.png` | `/checkout` |
| Mobile / Pagamento | `16:748` | `mobile-pagamento.png` | `/checkout` |
| Desktop / Confirmação de Pedido | `11:4385` | `desktop-confirmacao.png` | `/orders/$orderId` |
| Desktop / Login | `9:115` | `desktop-login.png` | `/login` |
| Mobile / Login | `16:1022` | `mobile-login.png` | `/login` |
| Desktop / Cadastro | `9:1022` | `desktop-cadastro.png` | `/register` |
| Mobile / Cadastro | `16:1228` | `mobile-cadastro.png` | `/register` |
| Desktop / Perfil do Colecionador | `9:1238` | `desktop-perfil.png` | `/account/profile` |
| Desktop / Carteiras | `9:1670` | `desktop-carteiras.png` | `/account/wallets` |

Observações de composição:
- **Login e Cadastro no desktop são um modal** (500px, abas "Entrar | Criar conta") sobre a Início.
  Decisão: as rotas `/login` e `/register` renderizam o modal sobre a Início (acesso direto funciona);
  no mobile são telas cheias.
- **Confirmação no desktop também é um modal** (578px) sobre a página de pagamento esmaecida.
  Decisão: `/orders/$orderId` mostra o recibo como cartão centralizado com o mesmo visual; o "X" volta ao início.
- Perfil, Carteiras e Confirmação não têm frame mobile → adaptar empilhando colunas.

## Inventário de componentes

### Globais
- **Header (desktop)**: logo "KURIO" · nav (Início, Mercado, Criadores, Aprenda; ativo = `accent` 700 +
  sublinhado 3px) · busca · carrinho com badge (16px, `primary`, borda 2px `background`) · botão "Entrar"
  (100×35, `primary`, ícone logout). Divisor inferior 1px `border` na Início/Login/Perfil.
  Variante logada não desenhada → trocar "Entrar" por avatar/menu da conta.
- **Header (mobile)**: barra de busca "Explorar coleções" + botão de filtro (52px, `primary`).
  Telas internas: botão voltar circular 35px + título centralizado.
- **Tab bar (mobile)**: Início, Favoritos, botão central elevado (65px, gradiente `primary`), Carrinho, Perfil.
- **Footer**: 3 cards de benefícios (círculo 74px com W/C/D) + newsletter (input + "Enviar") · faixa
  `surface-dark` com logo/contato · 4 colunas de links (Meu perfil, Central de ajuda, Coleções, Redes
  sociais + pílula "Carteiras compatíveis") · copyright. Links fora do escopo → desabilitados ("Em breve").
- **Breadcrumb**: "Início / Mercado / …", 15px 700.
- **Botões**: primário (`primary`, texto `background` 700, raio 5–6); secundário com contorno
  ("Favoritar": borda `primary`, texto `foreground`); link (`accent`); social (borda `border`, 340×40);
  ícone circular (35px, `card-raised`, borda `border`).
- **Input**: 40px de altura, borda 1px `border`, raio 3, padding 12, texto 14px, placeholder `muted`.
  Label 15px acima + asterisco `destructive` nos obrigatórios. Select com chevron. Campo de senha com
  ícone de mostrar/ocultar. Input mobile: 50px, raio ~10.
- **Radio**: círculo 16px com borda `primary`; marcado = ponto `primary`.
- **Modal**: `card`, sombra overlay, "X" `primary` no canto, faixa inferior 10px `primary`.

### Início
- Hero desktop (texto + CTA "EXPLORAR" + imagem 450×450 r=24 + indicador de 3 pontos).
  Hero mobile: card com gradiente, mini-imagens, "EXPLORAR →".
- **FilterSidebar** (310px, `card`, padding 20): Coleções (lista com contagem; ativa em `accent`) ·
  Faixa de preço (slider de 2 pontos + "Aplicar") · Rede (Ethereum/Polygon/Solana com contagem).
  Mobile: abre pelo botão de filtro (drawer).
- **NFT em destaque** (banner "OFERTA LIMITADA") abaixo dos filtros.
- **Toolbar**: abas (Todos os NFTs / Novos lançamentos / Em alta; ativa sublinhada) + "Ordenar por:" dropdown.
- **NftCard**: 258×356; moldura `card` 258×300 com imagem 250×250; nome 15px; preço 16px 700 `accent`;
  preço antigo riscado opcional; tag "RARO" (`primary`); no hover: ações carrinho/favoritar/ver.
  Mobile: 175px, raio 20, botão favoritar circular 28px.
- **Pagination**: quadrados 35px (ativo `primary`), seta próxima.
- **Promos**: 2 cards 586×250 (imagem + texto + "Explorar →").
- **Blog "Diário da Cunhagem"**: 4 cards 268×369 — editorial, fora do escopo (links desabilitados).

### Detalhe do NFT
- Galeria: 4 miniaturas 100px + imagem principal com botão de zoom. Mobile: imagem de topo + voltar/favoritar.
- Título 24px, preço `accent`, estrelas + "19 avaliações".
- Descrição; **seletor de edição** (pílulas 1/1, 1/10, 1/50, ABERTA; selecionada com borda `primary`).
- **QuantityStepper**: botões −/+ arredondados (`primary`) com número no meio.
- Ações: "COMPRAR" (primário) + "Favoritar" (contorno, ícone coração). Mobile: barra inferior
  "Qtd." + preço + "Comprar NFT" + botão carrinho.
- Metadados (ID do token, Coleção, Atributos), compartilhar (LinkedIn, e-mail, Twitter).
- Abas "Detalhes do NFT | Avaliações (19)"; carrossel "Mais desta coleção" (5 cards + pontos).

### Carrinho
- Tabela: NFT (miniatura 70px + nome + ID do token) · Preço · Edições (stepper) · Total · lixeira.
  Linhas em `card`, altura 70.
- **CartSummary** ("Resumo da carteira"): código promocional (input + "Aplicar"), Subtotal, Desconto
  do lançamento, Taxa de rede + "Taxa estimada", Total (`accent`), "Conectar e finalizar", "Continuar explorando".
- Carrossel "Colecionadores também viram".
- Mobile: cards de item 358×100 (r=14) com stepper redondo 24px e lixeira; resumo fixo embaixo.

### Pagamento
- Formulário "Perfil do colecionador" em 2 colunas (Nome de exibição, Nome de usuário, Rede [select],
  Nome do perfil, Endereço da carteira, ENS opcional, Tipo de carteira [select], Código de indicação,
  E-mail, Nome ENS [.eth select]) · checkbox "Usar outra carteira?" · textarea "Observação (opcional)".
- Coluna "Seus NFTs": itens (x qtd + subtotal), "Tem um código promocional?", resumo de valores,
  "Carteira e rede" (radios: pílula de carteiras, MetaMask, Coinbase Wallet) · "Confirmar compra".
- Mobile: "Pagamento com carteira" — carteiras conectadas (Reserva/Principal, menu ⋮, "Trocar carteira"),
  lista WalletConnect/MetaMask/Coinbase com radio, Total, "Confirmar compra".

### Confirmação
- Ícone "Thank you", "Seus NFTs agora estão na sua carteira", faixa com ID da transação · Data ·
  Total · Carteira; tabela de itens (Edições, Subtotal); Taxa de rede; Total; texto de confirmação;
  botão "Ver no Etherscan" (link simulado).

### Login / Cadastro
- Login: abas, subtítulo, e-mail, senha (mostrar/ocultar), "Esqueceu a senha?" (fora do escopo →
  desabilitado), "Entrar", divisor "Ou continue com", Google/Facebook (fora do escopo → desabilitados).
- Cadastro: Nome de usuário, e-mail, senha, confirmar senha, "Criar conta"/"Criar perfil".
- Mobile: logo "KURIO" grande, título, inputs 50px, link "Novo na Kurio? Crie uma conta" / "Já tem uma conta? Entre".

### Perfil / Carteiras
- **AccountSidebar** "Meu perfil" (310px, `card`): Dados do perfil, Carteiras, Atividade, Lista de
  interesse, Ofertas, Arquivos baixados, Suporte, Sair. Item ativo: barra 6px `primary` à esquerda.
  Fora do escopo: Atividade, Ofertas, Arquivos baixados, Suporte → desabilitados.
- Perfil: Nome de exibição, Nome de usuário, E-mail, Nome ENS (.eth + campo), Apelido da carteira,
  Avatar (círculo + "Alterar"/"Remover"), "Alterar senha" (atual, nova, confirmar), "Salvar".
- Carteiras: "Carteira principal" (Nome de exibição, Apelido, Rede, Nome do perfil, Endereço, ENS
  secundário, Tipo, Código de indicação, E-mail, Nome ENS) + "Salvar carteira"; "Carteira secundária"
  (estado vazio, "Igual à carteira principal", "Adicionar").

### Estados não desenhados (seguir o mesmo padrão visual)
Skeletons com shimmer (catálogo, detalhe, resumo), vazio (busca sem resultado, carrinho vazio),
erro com "Tentar novamente", toasts (`card` + borda `primary`), mensagens de erro de campo em
`destructive` abaixo do input, header logado, 404, pedido pendente/recusado.

## Assets

Todos locais em `public/` (manifesto completo em `design/assets.json`).

### Imagens (`public/images/`)
O Figma usa só **4 artes**, repetidas em todas as telas (1254×1254 PNG, ~2 MB cada):

| Arquivo | Personagem |
|---|---|
| `nft-art-1.png` | Macaco marrom de óculos, jaqueta verde (hero, Emerald Ape) |
| `nft-art-2.png` | Gorila de chapéu e moletom roxo (Sage/Violet Nomad, destaque) |
| `nft-art-3.png` | Macaco preto de terno bege (Neon Vessel, Ivory Baron) |
| `nft-art-4.png` | Macaco laranja com fones (Golden Beat/Signal) |

Os ~60 NFTs das fixtures vão reutilizar essas 4 artes. Os PNGs originais pesam ~2 MB: gerar
versões WebP/AVIF redimensionadas (ex.: 300/600/1200px) no passo 17 para o Lighthouse.

### Ícones (`public/icons/`, SVG)
- Header/nav: `logo.svg`, `search-icon.svg`, `search-mobile.svg`, `cart-icon.svg`, `logout.svg`, `curved-logout.svg`
- Mobile: `bold-home.svg`, `user.svg`, `shop.svg`, `heart-mobile.svg`, `scan.svg`, `curved-filter.svg`,
  `curved-arrow-left-2.svg`, `card-favorite.svg`, `minus-mobile.svg`, `plus-mobile.svg`, `kebab.svg`, `curved-wallet.svg`
- Ações: `heart.svg`, `shopping.svg`, `curved-delete.svg`, `close.svg`, `bold-star.svg`, `message.svg`,
  `curved-hide.svg`, `light-outline-hide.svg`, `chevron-down.svg`, `two-tone-arrow-down-2.svg`,
  `curved-arrow-right.svg`, `curved-arrow-right-2.svg`, `carousel-dots.svg`
- Conta: `light-outline-location.svg`, `curved-activity.svg`, `curved-download.svg`,
  `curved-danger-triangle.svg`, `curved-image-2.svg`
- Social/login: `google.svg`, `facebook.svg`, `social-facebook.svg`, `social-instagram.svg`,
  `social-twitter.svg`, `social-linkedin.svg`, `social-youtube.svg`
- Confirmação: `thank-you.svg`

### Fontes (`public/fonts/`)
- `roboto-mono-latin.woff2` — Roboto Mono variável (100–700), subset latin, do Google Fonts (OFL).

### Substituições e lacunas
- Os textos de alguns layers do Figma estão em inglês no nome, mas o conteúdo renderizado é em
  português — vale o conteúdo (ver outlines/screenshots).
- O frame Início usa "Seja dono do futuro da arte digital"; o mobile usa "Seja dono da cultura digital".
  Usar o texto do desktop nos dois.
- Os ícones de +/− do desktop são formas simples (círculo `primary` + traço) — fazer com CSS/lucide.
- Ícones sem equivalente no Figma (menu, alerta, check, spinner) → `lucide-react`, que já vem com o shadcn.
- O Figma só desenha avatar como ícone genérico (`curved-image-2.svg`); avatares de usuário das
  fixtures serão as próprias artes recortadas.

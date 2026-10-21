# Resultados do Lighthouse

Gerado por "pnpm lighthouse" (lighthouse/run.mjs) em 2026-10-21.
Mediana de 3 rodadas por página e perfil. Relatórios completos (HTML e JSON de cada rodada) em
lighthouse/reports/. Os da rodada mediana de cada página × perfil (*-mediana.html/json) ficam no repositório;
as demais rodadas são geradas a cada execução e não são versionadas.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Início | mobile | 72 | 100 | 100 | 100 | 4.75 s | 0.000 | 179 ms |
| Início | desktop | 97 | 100 | 100 | 100 | 1.10 s | 0.005 | 0 ms |
| Detalhe | mobile | 74 | 100 | 100 | 100 | 4.43 s | 0.000 | 180 ms |
| Detalhe | desktop | 98 | 100 | 100 | 100 | 1.00 s | 0.000 | 0 ms |

Metas do desafio: Performance 90 · Acessibilidade 95 ·
Boas práticas 95 · SEO 90.

## Condições
- Build de produção ("pnpm build") servido por "vite preview" em http://localhost:4174, **com os mocks ligados**
  (VITE_ENABLE_MOCKS=true, cenário "default": 250 ms por resposta da API simulada).
- Perfil **mobile**: padrão do Lighthouse (tela de celular, 4G lento simulado, CPU 4× mais lenta).
  Perfil **desktop**: preset oficial de desktop do Lighthouse.
- Cada rodada abre um Chrome novo (armazenamento limpo: o service worker do MSW é registrado de novo).
- Versões: Node v24.14.1 · Lighthouse 13.5.0 · Chromium 156.0.0.0
  (o do Playwright) · Vite ^8.3.4 · React ^19.3.1.
- Máquina: win32 x64.

## Abaixo da meta
- Início · mobile · performance: 72 (meta 90)
- Detalhe · mobile · performance: 74 (meta 90)

### Por que a performance fica abaixo da meta
Só o perfil **mobile** fica abaixo (desktop: 98). O diagnóstico, pelos próprios relatórios:
- **FCP ~3,5 s — nada pinta antes do JavaScript.** O \`index.html\` só tem \`<div id="root">\`: a primeira pintura
  espera o JS principal (~146 KB comprimidos, ~0,8 s de execução com a CPU 4× mais lenta). React + react-dom são
  ~45% dele; Query e Router, quase todo o resto.
- **LCP ~4,5–4,7 s — os dados passam pela API simulada.** A cadeia é JS principal → chunk do MSW (~165 KB, com o
  binding do Socket.IO) → registro do service worker → resposta da API (250 ms no cenário padrão) → imagem.
  Num deploy com backend real, o MSW e o service worker saem do caminho.
- **Por que um "shell" em HTML não resolve aqui:** o Lighthouse mobile carrega a página **sem** limitação e depois
  **simula** o 4G lento. Na carga real, o JS local chega e o React monta antes da primeira pintura — então, na
  simulação, a pintura continua dependendo do JS, mesmo com header e barra inferior em HTML puro.

### Experimentos (mediana de 3 rodadas, mobile)
| Passo | Início | LCP Início | Detalhe | LCP Detalhe | Resultado |
|---|---|---|---|---|---|
| Linha de base | 71 | 5,13 s | 75 | 4,63 s | — |
| 1. CSS embutido no HTML | 71 | 5,14 s | 75 | 4,55 s | sem efeito no simulado; **mantido** (1 requisição a menos em redes reais) |
| 2. + preload do chunk do MSW | 72 | 4,74 s | 75 | 4,44 s | **mantido**: o LCP cai ~0,4 s no Início |
| 3. + shell estático (header e barra inferior) | 73 | 4,74 s | 73 | 4,52 s | FCP não mudou; **desfeito** (passo de build a mais sem ganho medido) |

As diferenças de ±2 pontos na nota entre rodadas são ruído; o ganho medido é o do LCP.

**O que não foi feito, de propósito** (o enunciado veda "simplificações exclusivas para melhorar a pontuação"):
reduzir a latência do cenário padrão, atrasar o início do app para depois da primeira pintura (faria o shell
"contar" no simulado sem ganho real), tirar funcionalidades da Início ou trocar o método de medição.

### O que já foi aplicado
- Preload do chunk do MSW e CSS embutido no HTML (\`vite.config.ts\`, experimentos acima).
- O app desenha a tela sem esperar o MSW: só as chamadas à API esperam (\`src/lib/api-ready.ts\`).
- Fora do carregamento inicial: modal de login (react-hook-form e zod), zod dos parâmetros de URL (funções
  simples), \`socket.io-client\`, painel de testes e cada rota (code-splitting).
- Artes de PNG de ~2 MB para WebP de ~13–40 KB, com \`srcset\`/\`sizes\`, \`width\`/\`height\` (CLS 0),
  \`loading="lazy"\` e \`fetchpriority="high"\` na imagem principal.
- Fonte pré-carregada (\`<link rel="preload">\`), \`lang\`, \`meta description\` e \`robots.txt\`.

### Próximos passos possíveis (fora do escopo)
Pré-renderizar o HTML da Início e do Detalhe **com os dados** (SSR/SSG), para a primeira pintura e a imagem principal
não dependerem do JS, e servir a API real em vez do MSW. Acessibilidade, Boas práticas e SEO atingem a meta em
todas as páginas e perfis.

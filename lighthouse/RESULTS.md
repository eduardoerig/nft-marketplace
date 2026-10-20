# Resultados do Lighthouse

Gerado por "pnpm lighthouse" (lighthouse/run.mjs) em 2026-10-20.
Mediana de 3 rodadas por página e perfil. Relatórios completos (HTML e JSON de cada rodada) em
lighthouse/reports/. Os da rodada mediana de cada página × perfil (*-mediana.html/json) ficam no repositório;
as demais rodadas são geradas a cada execução e não são versionadas.

| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Início | mobile | 72 | 100 | 100 | 100 | 5.12 s | 0.000 | 154 ms |
| Início | desktop | 98 | 100 | 100 | 100 | 1.12 s | 0.005 | 0 ms |
| Detalhe | mobile | 74 | 100 | 100 | 100 | 4.68 s | 0.000 | 191 ms |
| Detalhe | desktop | 98 | 100 | 100 | 100 | 1.07 s | 0.000 | 0 ms |

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

### Por que a performance fica abaixo da meta (e o que já foi feito)
O que pesa é a arquitetura exigida pelo desafio, não a interface:
- **SPA sem renderização no servidor:** nada aparece antes de o JavaScript principal baixar e executar. No
  perfil mobile isso é simulado num celular de entrada (CPU 4× mais lenta, rede 4G lenta). O React + react-dom
  sozinhos são ~45% do bundle principal.
- **API simulada no navegador:** o MSW (~165 KB comprimidos, com o binding do Socket.IO) e o registro do
  service worker vêm antes de qualquer dado. Os dados (hero, cards) só chegam depois disso + 250 ms de latência
  simulada por resposta. Num deploy com backend real, esse custo some.

Já aplicado no passo 17:
- O app desenha a tela sem esperar o MSW: só as chamadas à API esperam (`src/lib/api-ready.ts`).
- Fora do carregamento inicial: modal de login (react-hook-form e zod), zod dos parâmetros de URL (funções
  simples), `socket.io-client`, painel de testes e cada rota (code-splitting).
- Artes de PNG de ~2 MB para WebP de ~13–40 KB, com `srcset`/`sizes`, `width`/`height` (CLS 0),
  `loading="lazy"` e `fetchpriority="high"` na imagem principal.
- Fonte pré-carregada (`<link rel="preload">`), `lang`, `meta description` e `robots.txt`.

Próximos passos possíveis, fora do escopo: pré-renderizar o HTML da Início e do Detalhe (SSR/SSG) e servir a
API real em vez do MSW. Acessibilidade, Boas práticas e SEO atingem a meta em todas as páginas e perfis.

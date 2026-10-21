// `pnpm lighthouse`: build de produção (com os mocks, cenário padrão) → preview → Lighthouse em
// Início e Detalhe, mobile e desktop, N vezes cada. Salva HTML/JSON de cada rodada em
// lighthouse/reports/ e escreve lighthouse/RESULTS.md com as medianas.
// Conferência rápida: `pnpm lighthouse --runs=1 --profile=mobile` (só a rodada completa reescreve o RESULTS.md).
import { spawn, execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const require = createRequire(import.meta.url)
const config = { ...require('./config.cjs') }
for (const arg of process.argv.slice(2)) {
  const [key, value] = arg.replace(/^--/, '').split('=')
  if (key === 'runs') config.runs = Number(value)
  if (key === 'profile') config.profiles = [value]
}
const official = config.runs >= 3 && config.profiles.length === 2
const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const reportsDir = join(here, 'reports')
mkdirSync(reportsDir, { recursive: true })

const sh = (cmd) => execSync(cmd, { cwd: root, stdio: 'inherit' })
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

async function waitForServer(url) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* ainda subindo */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`O preview não respondeu em ${url}`)
}

console.log('› build de produção (com mocks)…')
sh('pnpm build')

const base = `http://localhost:${config.port}`
const preview = spawn('pnpm', ['preview', '--port', String(config.port), '--strictPort'], {
  cwd: root,
  shell: true,
  stdio: 'ignore',
})

const results = []
try {
  await waitForServer(base)
  const chromePath = chromium.executablePath() // o Chromium que o Playwright instala
  for (const page of config.pages) {
    for (const profile of config.profiles) {
      for (let run = 1; run <= config.runs; run++) {
        const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ['--headless=new'] })
        const settings = { onlyCategories: config.categories, output: ['html', 'json'] }
        const lhConfig =
          profile === 'desktop'
            ? { ...desktopConfig, settings: { ...desktopConfig.settings, ...settings } }
            : { extends: 'lighthouse:default', settings }
        const result = await lighthouse(`${base}${page.path}`, { port: chrome.port }, lhConfig)
        await chrome.kill()

        const slug = `${page.path === '/' ? 'inicio' : 'detalhe'}-${profile}-${run}`
        const [html, json] = result.report
        writeFileSync(join(reportsDir, `${slug}.html`), html)
        writeFileSync(join(reportsDir, `${slug}.json`), json)

        const lhr = result.lhr
        const scores = Object.fromEntries(
          config.categories.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)]),
        )
        const audit = (id) => lhr.audits[id]?.numericValue ?? 0
        results.push({
          page: page.name,
          profile,
          run,
          slug,
          scores,
          lcp: audit('largest-contentful-paint'),
          cls: audit('cumulative-layout-shift'),
          tbt: audit('total-blocking-time'),
          lighthouseVersion: lhr.lighthouseVersion,
          userAgent: lhr.environment?.hostUserAgent ?? '',
        })
        console.log(`› ${page.name} · ${profile} · rodada ${run}:`, scores)
      }
    }
  }
} finally {
  // No Windows o preview roda dentro de um shell: encerra a árvore inteira (antes de matar o shell,
  // senão o node do preview fica órfão e a porta continua ocupada).
  if (process.platform === 'win32' && preview.pid) {
    try {
      execSync(`taskkill /pid ${preview.pid} /T /F`, { stdio: 'ignore' })
    } catch {
      /* já terminou */
    }
  }
  preview.kill()
}

// --- RESULTS.md ---------------------------------------------------------------
const JUSTIFICATION = `
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
`
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const chromeVersion = (results[0]?.userAgent.match(/Chrome\/([\d.]+)/) ?? [])[1] ?? '?'
const rows = []
const below = []
for (const page of config.pages) {
  for (const profile of config.profiles) {
    const runs = results.filter((r) => r.page === page.name && r.profile === profile)
    const m = Object.fromEntries(config.categories.map((c) => [c, median(runs.map((r) => r.scores[c]))]))
    const lcp = median(runs.map((r) => r.lcp)) / 1000
    const cls = median(runs.map((r) => r.cls))
    const tbt = median(runs.map((r) => r.tbt))
    // A rodada com a performance mediana vira o relatório entregue (só os *-mediana.* são versionados).
    const representative = runs.find((r) => r.scores.performance === m.performance) ?? runs[0]
    if (official && representative) {
      const name = representative.slug.replace(/-\d+$/, '') // "inicio-mobile-2" → "inicio-mobile"
      for (const ext of ['html', 'json']) {
        copyFileSync(
          join(reportsDir, `${representative.slug}.${ext}`),
          join(reportsDir, `${name}-mediana.${ext}`),
        )
      }
    }
    rows.push(
      `| ${page.name} | ${profile} | ${config.categories.map((c) => m[c]).join(' | ')} | ${lcp.toFixed(2)} s | ${cls.toFixed(3)} | ${Math.round(tbt)} ms |`,
    )
    for (const c of config.categories) {
      if (m[c] < config.targets[c])
        below.push(`${page.name} · ${profile} · ${c}: ${m[c]} (meta ${config.targets[c]})`)
    }
  }
}

const md = [
  '# Resultados do Lighthouse',
  '',
  `Gerado por "pnpm lighthouse" (lighthouse/run.mjs) em ${new Date().toISOString().slice(0, 10)}.`,
  `Mediana de ${config.runs} rodadas por página e perfil. Relatórios completos (HTML e JSON de cada rodada) em`,
  'lighthouse/reports/. Os da rodada mediana de cada página × perfil (*-mediana.html/json) ficam no repositório;',
  'as demais rodadas são geradas a cada execução e não são versionadas.',
  '',
  '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |',
  '|---|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  `Metas do desafio: Performance ${config.targets.performance} · Acessibilidade ${config.targets.accessibility} ·`,
  `Boas práticas ${config.targets['best-practices']} · SEO ${config.targets.seo}.`,
  '',
  '## Condições',
  `- Build de produção ("pnpm build") servido por "vite preview" em ${base}, **com os mocks ligados**`,
  '  (VITE_ENABLE_MOCKS=true, cenário "default": 250 ms por resposta da API simulada).',
  '- Perfil **mobile**: padrão do Lighthouse (tela de celular, 4G lento simulado, CPU 4× mais lenta).',
  '  Perfil **desktop**: preset oficial de desktop do Lighthouse.',
  '- Cada rodada abre um Chrome novo (armazenamento limpo: o service worker do MSW é registrado de novo).',
  `- Versões: Node ${process.version} · Lighthouse ${results[0]?.lighthouseVersion ?? '?'} · Chromium ${chromeVersion}`,
  `  (o do Playwright) · Vite ${pkg.devDependencies.vite} · React ${pkg.dependencies.react}.`,
  `- Máquina: ${process.platform} ${process.arch}.`,
  '',
  '## Abaixo da meta',
  below.length === 0 ? 'Nenhuma: todas as medianas atingem as metas.' : below.map((b) => `- ${b}`).join('\n'),
  below.length === 0 ? '' : JUSTIFICATION,
].join('\n')
if (official) {
  writeFileSync(join(here, 'RESULTS.md'), md)
  console.log('\n› lighthouse/RESULTS.md escrito.')
} else {
  console.log(`\n${rows.join('\n')}\n(rodada rápida: o RESULTS.md não foi alterado)`)
}
if (below.length) console.log('Abaixo da meta:\n' + below.join('\n'))

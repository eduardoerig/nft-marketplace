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
### Por que a performance fica abaixo da meta (e o que já foi feito)
O que pesa é a arquitetura exigida pelo desafio, não a interface:
- **SPA sem renderização no servidor:** nada aparece antes de o JavaScript principal baixar e executar. No
  perfil mobile isso é simulado num celular de entrada (CPU 4× mais lenta, rede 4G lenta). O React + react-dom
  sozinhos são ~45% do bundle principal.
- **API simulada no navegador:** o MSW (~165 KB comprimidos, com o binding do Socket.IO) e o registro do
  service worker vêm antes de qualquer dado. Os dados (hero, cards) só chegam depois disso + 250 ms de latência
  simulada por resposta. Num deploy com backend real, esse custo some.

Já aplicado no passo 17:
- O app desenha a tela sem esperar o MSW: só as chamadas à API esperam (\`src/lib/api-ready.ts\`).
- Fora do carregamento inicial: modal de login (react-hook-form e zod), zod dos parâmetros de URL (funções
  simples), \`socket.io-client\`, painel de testes e cada rota (code-splitting).
- Artes de PNG de ~2 MB para WebP de ~13–40 KB, com \`srcset\`/\`sizes\`, \`width\`/\`height\` (CLS 0),
  \`loading="lazy"\` e \`fetchpriority="high"\` na imagem principal.
- Fonte pré-carregada (\`<link rel="preload">\`), \`lang\`, \`meta description\` e \`robots.txt\`.

Próximos passos possíveis, fora do escopo: pré-renderizar o HTML da Início e do Detalhe (SSR/SSG) e servir a
API real em vez do MSW. Acessibilidade, Boas práticas e SEO atingem a meta em todas as páginas e perfis.
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

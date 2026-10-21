import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * No build, troca o <link rel="stylesheet"> do CSS principal por um <style> com o conteúdo dele.
 * O CSS chega junto com o HTML (~18 KB comprimido): uma requisição a menos bloqueando a renderização.
 * No Lighthouse mobile o FCP não mudou, porque ele depende do JS (ver lighthouse/RESULTS.md); fica pelo
 * ganho em redes reais, onde cada ida e volta custa.
 */
function inlineMainCss(): Plugin {
  return {
    name: 'inline-main-css',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return html
        return html.replace(
          /<link rel="stylesheet"[^>]*href="\/([^"]+\.css)"[^>]*>/g,
          (tag, fileName: string) => {
            const asset = bundle[fileName]
            if (asset?.type !== 'asset') return tag
            return `<style>${String(asset.source)}</style>`
          },
        )
      },
    },
  }
}

/**
 * Com os mocks ligados, a API simulada (src/mocks/browser.ts) é um import dinâmico: o navegador só começava a
 * baixar esse chunk (~165 KB comprimido) depois de executar o JS principal, e todos os dados esperam por ele.
 * Um <link rel="modulepreload"> no HTML baixa o chunk e suas dependências em paralelo com o JS principal.
 * Sem mocks o chunk nem existe no build, e nada é adicionado.
 */
function preloadMocks(): Plugin {
  return {
    name: 'preload-mocks',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        if (!bundle) return html
        const mocks = Object.values(bundle).find(
          (chunk) => chunk.type === 'chunk' && chunk.facadeModuleId?.endsWith('/src/mocks/browser.ts'),
        )
        if (mocks?.type !== 'chunk') return html
        const entry = Object.values(bundle).find((chunk) => chunk.type === 'chunk' && chunk.isEntry)
        const files = [mocks.fileName, ...mocks.imports].filter((file) => file !== entry?.fileName)
        const links = files.map((file) => `<link rel="modulepreload" crossorigin href="/${file}">`).join('')
        return html.replace('</head>', `${links}</head>`)
      },
    },
  }
}

export default defineConfig({
  plugins: [
    // Gera src/routeTree.gen.ts a partir dos arquivos em src/routes/ (precisa vir antes do react).
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    inlineMainCss(),
    preloadMocks(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

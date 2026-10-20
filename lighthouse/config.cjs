// Configuração da auditoria Lighthouse (usada por lighthouse/run.mjs, comando `pnpm lighthouse`).
// Perfis: "mobile" é o padrão do Lighthouse (Moto G Power, 4G lento, CPU 4x mais lenta);
// "desktop" é o preset oficial de desktop (1350×940, sem limitação de CPU, rede rápida).
module.exports = {
  port: 4174, // preview do build (a 4173 é dos testes E2E)
  runs: 3, // cada página × perfil roda 3 vezes; o RESULTS.md mostra a mediana
  pages: [
    { name: 'Início', path: '/' },
    { name: 'Detalhe', path: '/nfts/1' },
  ],
  profiles: ['mobile', 'desktop'],
  categories: ['performance', 'accessibility', 'best-practices', 'seo'],
  // Metas do desafio (§10).
  targets: { performance: 90, accessibility: 95, 'best-practices': 95, seo: 90 },
}

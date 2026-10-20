// Sem rolagem horizontal nas larguras do desafio (390, 768, 1440), em 640 px (= 1280 px com zoom de
// 200%) e em 320 px (reflow da WCAG 1.4.10). Roda uma vez só, no projeto desktop, mudando a largura.
import type { Page } from '@playwright/test'
import { login } from './auth-helpers'
import { expect, test } from './fixtures'
import { addToCart, EMERALD_APE } from './shop-helpers'

const WIDTHS = [320, 390, 640, 768, 1024, 1440]
const PAGES = ['/', '/nfts/1', '/cart', '/checkout', '/account/profile', '/account/wallets', '/?auth=login']

/** Elementos mais largos que a tela (para a mensagem de erro dizer o culpado). */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    if (document.documentElement.scrollWidth <= width) return []
    // Só quem vaza de verdade: nenhum ancestral corta ou rola o excesso (um carrossel com
    // overflow-x-auto pode ter itens fora da tela sem a página rolar).
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (['hidden', 'auto', 'scroll', 'clip'].includes(getComputedStyle(p).overflowX)) return true
      }
      return false
    }
    return [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > width + 1 && !clipped(el))
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`)
  })
}

test('nenhuma tela rola na horizontal de 320 a 1440 px', async ({ page, isMobile }) => {
  test.skip(isMobile, 'roda uma vez (no projeto desktop), passando por todas as larguras')
  test.setTimeout(120_000)
  await login(page, 'ana@example.com')
  await addToCart(page, [EMERALD_APE])

  const problems: string[] = []
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of PAGES) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const culprits = await overflow(page)
      if (culprits.length > 0) problems.push(`${width}px ${path}: ${culprits.join(', ')}`)
    }
  }
  expect(problems, problems.join('\n')).toEqual([])
})

import { login } from './auth-helpers'
import { expect, test } from './fixtures'

test.describe('tablet (768–1023px): header com menu ☰', () => {
  test.use({ viewport: { width: 820, height: 1180 } })

  test('menu abre com foco no 1º link e sem dica "Em breve" sozinha', async ({ page, isMobile }) => {
    test.skip(isMobile, 'o mesmo cenário de tablet roda uma vez só (projeto desktop)')
    await page.goto('/')
    await page.getByRole('button', { name: 'Abrir menu' }).click()

    const menu = page.getByRole('dialog', { name: 'KURIO' })
    await expect(menu.getByRole('link', { name: 'Início' })).toBeFocused()
    await expect(page.getByRole('tooltip')).toHaveCount(0)

    // A dica aparece quando o usuário chega no item. Esc fecha uma camada por vez:
    // o 1º fecha a dica, o 2º fecha o menu.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    const tip = page.getByRole('tooltip', { name: 'Em breve' })
    await expect(tip).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(tip).toBeHidden()
    await expect(menu).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
  })
})

test('mobile segue o Figma: sem header do site, navegação pela barra inferior', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'regra do layout mobile')
  await page.goto('/')
  await expect(page.getByRole('banner')).toBeHidden()
  const tabBar = page.getByRole('navigation', { name: 'Atalhos' })
  await expect(tabBar.getByRole('link', { name: 'Perfil', exact: true })).toBeVisible()

  // Logado, o Perfil diz quem é (no mobile o nome não aparece em outro lugar).
  await login(page, 'ana@example.com')
  await expect(tabBar.getByRole('link', { name: 'Perfil de Ana Souza' })).toBeVisible()

  // Telas internas sem frame no Figma usam o padrão "voltar + título".
  await page.goto('/account/profile')
  await expect(page.getByRole('link', { name: 'Voltar ao início' })).toBeVisible()
})

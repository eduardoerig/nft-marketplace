import { expect, test } from './fixtures'

test('menu mobile abre com foco no 1º link e sem dica "Em breve" sozinha', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'o menu só existe abaixo de 1024px')
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

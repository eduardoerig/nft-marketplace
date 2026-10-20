// Operação por teclado e foco. As verificações automáticas de acessibilidade (axe) também moram aqui.
import type { Locator, Page } from '@playwright/test'
import { expect, test } from './fixtures'
import { connectWallet, startCheckout } from './shop-helpers'

/** Aperta Tab até o foco chegar ao elemento (falha se não chegar em `max` passos). */
async function tabTo(page: Page, target: Locator, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    if (await target.evaluate((el) => el === document.activeElement)) return
  }
  throw new Error('O foco nunca chegou ao elemento esperado.')
}

test('"Pular para o conteúdo" é o 1º Tab e leva o foco ao conteúdo', async ({ page }) => {
  await page.goto('/')
  // O app só aparece depois que a API simulada liga: espera a tela antes do 1º Tab.
  await expect(page.getByRole('main')).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.locator('#conteudo')).toBeFocused()
})

test('só com teclado: do catálogo ao detalhe e ao carrinho', async ({ page, isMobile }) => {
  await page.goto('/?q=Golden+Beat#catalogo')
  const card = page.getByRole('link', { name: /Golden Beat #207/ }).first()
  await tabTo(page, card)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/nfts/7')

  const buy = page.getByRole('button', { name: isMobile ? 'Comprar NFT' : 'COMPRAR', exact: true })
  await tabTo(page, buy)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/cart')
  await expect(page.getByRole('heading', { name: 'Golden Beat #207' })).toBeVisible()
})

test('login: o foco entra no diálogo, fica preso nele e volta ao link que o abriu', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'o "Entrar" do header só existe a partir do tablet')
  await page.goto('/')
  const open = page.getByRole('link', { name: 'Entrar', exact: true })
  await tabTo(page, open)
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('E-mail')).toBeFocused()

  // Muitos Tabs: o foco nunca sai do diálogo.
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }

  // Esc fecha (num link "Em breve" o 1º Esc fecha só a dica — por isso volta ao e-mail antes).
  await dialog.getByLabel('E-mail').focus()
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(open).toBeFocused()
})

test('formulário: Enter envia, o erro é lido junto do campo e o foco vai ao 1º inválido', async ({
  page,
}) => {
  await startCheckout(page)
  await page.getByLabel('Nome de exibição').fill('')
  const email = page.getByRole('textbox', { name: 'E-mail', exact: true })
  await email.fill('x')
  await email.press('Enter')

  const name = page.getByLabel('Nome de exibição')
  await expect(name).toBeFocused()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toHaveAccessibleDescription('Use de 2 a 40 caracteres.')
})

test('revisão do pedido: foco preso no diálogo e Esc volta ao "Confirmar compra"', async ({ page }) => {
  await startCheckout(page)
  await connectWallet(page)
  const confirm = page.getByRole('button', { name: 'Confirmar compra' })
  await confirm.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
  await expect(dialog).toBeVisible()
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(confirm).toBeFocused()
})

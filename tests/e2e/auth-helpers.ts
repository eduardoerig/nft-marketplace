// Ações de login/logout reaproveitadas pelos testes. Sempre pela interface (modal de login).
import type { Page } from '@playwright/test'
import { expect } from './fixtures'

export const PASSWORD = 'Senha@123' // senha fictícia das fixtures (ver src/mocks/fixtures/users.ts)

export async function fillLogin(page: Page, email: string, password = PASSWORD) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByLabel('Senha', { exact: true }).fill(password)
  await dialog.getByRole('button', { name: 'Entrar' }).click()
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto('/login')
  await fillLogin(page, email, password)
  await expect(page.getByRole('dialog')).toBeHidden()
}

// Desktop: o nome aparece no menu da conta do header. Mobile (sem header no Figma): no rótulo do
// Perfil da barra inferior — que não existe nas telas de compra (/nfts, /cart…).
export async function expectLoggedInAs(page: Page, name: string, isMobile: boolean) {
  if (isMobile) await expect(page.getByRole('link', { name: `Perfil de ${name}` })).toBeVisible()
  else await expect(page.getByRole('button', { name: `Conta de ${name}` })).toBeVisible()
}

// Desktop: menu da conta → Sair. Mobile: "Sair" do menu "Meu perfil" da tela de conta.
export async function logout(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.goto('/account/profile')
    await page.getByRole('navigation', { name: 'Meu perfil' }).getByRole('button', { name: 'Sair' }).click()
  } else {
    await page.getByRole('button', { name: /^Conta de / }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()
}

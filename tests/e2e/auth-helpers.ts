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

// Desktop: menu da conta no header. Mobile: dentro do menu ☰.
async function openAccount(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('button', { name: 'Abrir menu' }).click()
  else await page.getByRole('button', { name: /^Conta de / }).click()
}

export async function expectLoggedInAs(page: Page, name: string, isMobile: boolean) {
  if (isMobile) {
    await openAccount(page, true)
    await expect(page.getByRole('dialog', { name: 'KURIO' }).getByText(name, { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
  } else {
    await expect(page.getByRole('button', { name: `Conta de ${name}` })).toBeVisible()
  }
}

export async function logout(page: Page, isMobile: boolean) {
  await openAccount(page, isMobile)
  if (isMobile) await page.getByRole('button', { name: 'Sair' }).click()
  else await page.getByRole('menuitem', { name: 'Sair' }).click()
  await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()
}

import { expectLoggedInAs, fillLogin, login, logout } from './auth-helpers'
import { expect, test } from './fixtures'

test('"Entrar" abre o modal por cima da página atual e o login mantém a pessoa nela', async ({
  page,
  isMobile,
}) => {
  await page.goto('/nfts/1')
  if (isMobile) await page.getByRole('button', { name: 'Abrir menu' }).click()
  await page.getByRole('link', { name: 'Entrar', exact: true }).click()

  await expect(page).toHaveURL('/nfts/1?auth=login')
  await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()

  // Fechar não muda de página.
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL('/nfts/1')
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

  // Entrar também não: o modal fecha e a pessoa continua no NFT.
  await page.goto('/nfts/1?auth=login')
  await fillLogin(page, 'ana@example.com')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).toHaveURL('/nfts/1')
  await expectLoggedInAs(page, 'Ana Souza', isMobile)
})

test('cadastro: e-mail já usado aparece no campo; conta nova entra logada', async ({ page, isMobile }) => {
  await page.goto('/register')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Nome de usuário').fill('carla')
  await dialog.getByLabel('E-mail').fill('ana@example.com')
  await dialog.getByLabel('Senha', { exact: true }).fill('outrasenha')
  await dialog.getByLabel('Confirmar senha').fill('outrasenha')
  await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()

  const email = dialog.getByLabel('E-mail')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await expect(email).toHaveAccessibleDescription('Este e-mail já está cadastrado.')

  await email.fill('carla@example.com')
  await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
  await expect(dialog).toBeHidden()
  await expectLoggedInAs(page, 'carla', isMobile)
})

test('cadastro: validação no cliente antes de chamar a API', async ({ page }) => {
  await page.goto('/register')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Senha', { exact: true }).fill('123')
  await dialog.getByLabel('Confirmar senha').fill('456')
  await dialog.getByRole('button', { name: /Criar (conta|perfil)/ }).click()
  await expect(dialog.getByLabel('Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
  await expect(dialog.getByLabel('Senha', { exact: true })).toHaveAccessibleDescription(
    'A senha precisa ter ao menos 8 caracteres.',
  )
  await expect(dialog.getByLabel('Confirmar senha')).toHaveAccessibleDescription('As senhas não conferem.')
})

test('login: senha errada mostra erro e não entra', async ({ page }) => {
  await page.goto('/login')
  await fillLogin(page, 'ana@example.com', 'senha-errada')
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
  expect(await page.evaluate(() => localStorage.getItem('session-token'))).toBeNull()
})

test('rota privada leva ao login, volta depois de entrar e o refresh mantém a sessão', async ({
  page,
  isMobile,
}) => {
  await page.goto('/account/profile')
  await expect(page).toHaveURL('/?auth=login&redirect=%2Faccount%2Fprofile')

  await fillLogin(page, 'ana@example.com')
  await expect(page).toHaveURL('/account/profile')
  await expect(page.getByRole('heading', { level: 1, name: 'Perfil do colecionador' })).toBeVisible()

  await page.reload()
  await expect(page).toHaveURL('/account/profile')
  await expectLoggedInAs(page, 'Ana Souza', isMobile)
})

test('logout e troca de usuário não deixam nada do usuário anterior', async ({ page, isMobile }) => {
  await login(page, 'ana@example.com')
  await expectLoggedInAs(page, 'Ana Souza', isMobile)

  await logout(page, isMobile)
  expect(await page.evaluate(() => localStorage.getItem('session-token'))).toBeNull()

  await login(page, 'bruno@example.com')
  await expectLoggedInAs(page, 'Bruno Lima', isMobile)
  await expect(page.getByText(/Ana Souza|ana@example\.com/)).toHaveCount(0)
})

test('sessão expirada numa tela privada volta ao login guardando o caminho', async ({ page }) => {
  await login(page, 'ana@example.com')
  await page.goto('/account/profile')
  // Espera o perfil chegar: assim nenhuma requisição da tela está no meio do caminho quando a sessão vencer.
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana Souza')

  // Vence a sessão no "servidor" (banco simulado) e recarrega: a API responde 401 SESSION_EXPIRED.
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('mock-db')!)
    for (const s of db.sessions) s.expiresAt = '2000-01-01T00:00:00.000Z'
    localStorage.setItem('mock-db', JSON.stringify(db))
  })
  await page.reload()

  await expect(page).toHaveURL('/?auth=login&redirect=%2Faccount%2Fprofile')
  await expect(page.getByText('Sua sessão expirou. Entre novamente.')).toBeVisible()
  await fillLogin(page, 'ana@example.com')
  await expect(page).toHaveURL('/account/profile')
})

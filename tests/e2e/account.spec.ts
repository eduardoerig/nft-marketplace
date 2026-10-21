import { expectLoggedInAs, login, logout } from './auth-helpers'
import { expect, test } from './fixtures'

// PNG 1×1 válido, para testar o upload do avatar sem depender de arquivo no disco.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('perfil: editar nome persiste após refresh e conflito aparece no campo', async ({ page, isMobile }) => {
  await login(page, 'ana@example.com')
  await page.goto('/account/profile')
  const profile = page.getByRole('form', { name: 'Perfil do colecionador' })

  await profile.getByLabel('Nome de exibição').fill('Ana Lima')
  await profile.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Perfil salvo.')).toBeVisible()
  await expectLoggedInAs(page, 'Ana Lima', isMobile) // o header usa a sessão revalidada

  await page.reload()
  await expect(profile.getByLabel('Nome de exibição')).toHaveValue('Ana Lima')

  // "bruno" já existe: o erro da API vai para o campo certo.
  const username = profile.getByLabel('Nome de usuário')
  await username.fill('bruno')
  await profile.getByRole('button', { name: 'Salvar' }).click()
  await expect(username).toHaveAttribute('aria-invalid', 'true')
  await expect(username).toHaveAccessibleDescription('Este nome de usuário já está em uso.')
})

test('perfil: avatar é enviado, persiste e pode ser removido; arquivo inválido é recusado', async ({
  page,
}) => {
  await login(page, 'ana@example.com')
  await page.goto('/account/profile')
  const avatar = page.getByRole('group', { name: 'Avatar' })
  const fileInput = avatar.getByLabel('Escolher imagem do avatar')

  await fileInput.setInputFiles({ name: 'nota.txt', mimeType: 'text/plain', buffer: Buffer.from('oi') })
  await expect(avatar.getByRole('alert')).toHaveText('Escolha uma imagem PNG, JPEG ou WebP.')

  await fileInput.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText('Avatar atualizado.')).toBeVisible()
  await expect(avatar.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

  await page.reload()
  await expect(avatar.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

  await avatar.getByRole('button', { name: 'Remover' }).click()
  await expect(avatar.getByRole('img', { name: 'Sem avatar' })).toBeVisible()
})

test('senha: atual errada dá erro no campo; trocada, vale no próximo login', async ({ page, isMobile }) => {
  await login(page, 'ana@example.com')
  await page.goto('/account/profile')
  const form = page.getByRole('form', { name: 'Alterar senha' })

  await form.getByLabel('Senha atual').fill('senha-errada')
  await form.getByLabel('Nova senha', { exact: true }).fill('NovaSenha@456')
  await form.getByLabel('Confirmar nova senha').fill('NovaSenha@456')
  await form.getByRole('button', { name: 'Alterar senha' }).click()
  const current = form.getByLabel('Senha atual')
  await expect(current).toHaveAttribute('aria-invalid', 'true')
  await expect(current).toHaveAccessibleDescription('A senha atual está incorreta.')

  // Nova senha igual à atual não é aceita.
  const newPassword = form.getByLabel('Nova senha', { exact: true })
  await current.fill('Senha@123')
  await newPassword.fill('Senha@123')
  await form.getByLabel('Confirmar nova senha').fill('Senha@123')
  await form.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(newPassword).toHaveAttribute('aria-invalid', 'true')
  await expect(newPassword).toHaveAccessibleDescription('A nova senha precisa ser diferente da atual.')

  await newPassword.fill('NovaSenha@456')
  await form.getByLabel('Confirmar nova senha').fill('NovaSenha@456')
  await form.getByRole('button', { name: 'Alterar senha' }).click()
  await expect(page.getByText('Senha alterada.')).toBeVisible()

  await logout(page, isMobile)
  await login(page, 'ana@example.com', 'NovaSenha@456')
  await expectLoggedInAs(page, 'Ana Souza', isMobile)
})

test('carteiras: endereço inválido é barrado; secundária nova persiste após refresh', async ({ page }) => {
  await login(page, 'bruno@example.com') // Bruno só tem a carteira principal
  await page.goto('/account/wallets')
  const secondary = page.getByRole('region', { name: 'Carteira secundária' })
  await expect(secondary.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()

  await secondary.getByRole('button', { name: 'Adicionar carteira secundária' }).click()
  const form = secondary.getByRole('form')
  // Dados do titular já vêm do perfil da conta.
  await expect(form.getByLabel('Nome de exibição')).toHaveValue('Bruno Lima')
  await expect(form.getByLabel('Nome do perfil')).toHaveValue('bruno')
  await expect(form.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue('bruno@example.com')

  await form.getByLabel('Apelido da carteira').fill('Reserva')
  await form.getByLabel('Rede').selectOption('polygon')
  await form.getByLabel('Endereço da carteira').fill('0x123')
  await form.getByLabel('Tipo de carteira').selectOption('coinbase')
  await form.getByLabel('ENS ou carteira secundária (opcional)').fill('não-é-ens')
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  const address = form.getByLabel('Endereço da carteira')
  await expect(address).toHaveAttribute('aria-invalid', 'true')
  await expect(address).toHaveAccessibleDescription('Use "0x" seguido de 40 caracteres hexadecimais.')
  await expect(form.getByLabel('Código de indicação')).toHaveAccessibleDescription(
    'Use de 4 a 20 letras, números ou "-".',
  )
  await expect(form.getByLabel('ENS ou carteira secundária (opcional)')).toHaveAccessibleDescription(
    'Use um nome .eth ou um endereço 0x.',
  )
  await expect(form.getByLabel('Nome ENS')).toHaveAccessibleDescription('Informe o nome ENS.')

  await address.fill('0x1111111111111111111111111111111111111111')
  await form.getByLabel('Nome ENS').fill('reserva-bruno')
  await form.getByLabel('Código de indicação').fill('kurio-bruno')
  await form.getByLabel('ENS ou carteira secundária (opcional)').fill('reserva.bruno.eth')
  await form.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva.')).toBeVisible()

  await page.reload()
  await expect(secondary.getByLabel('Endereço da carteira')).toHaveValue(
    '0x1111111111111111111111111111111111111111',
  )
  await expect(secondary.getByLabel('Rede')).toHaveValue('polygon')
  await expect(secondary.getByLabel('Código de indicação')).toHaveValue('KURIO-BRUNO')
  await expect(secondary.getByLabel('ENS ou carteira secundária (opcional)')).toHaveValue('reserva.bruno.eth')
  await expect(secondary.getByLabel('Nome ENS')).toHaveValue('reserva-bruno')
})

test('carteiras: "Igual à carteira principal" copia os dados da principal', async ({ page }) => {
  await login(page, 'bruno@example.com')
  await page.goto('/account/wallets')
  const primaryAddress = await page
    .getByRole('region', { name: 'Carteira principal' })
    .getByLabel('Endereço da carteira')
    .inputValue()

  const secondary = page.getByRole('region', { name: 'Carteira secundária' })
  await secondary.getByLabel('Igual à carteira principal').check()
  await expect(secondary.getByLabel('Endereço da carteira')).toHaveValue(primaryAddress)
  await expect(secondary.getByLabel('Código de indicação')).toHaveValue('KURIO-BRUNO')
  await expect(secondary.getByLabel('Apelido da carteira')).toHaveValue('')
})

import { fillLogin, login, logout } from './auth-helpers'
import { expect, test } from './fixtures'
import { addToCart, connectWallet, EMERALD_APE, openReview, ordersInDb, startCheckout } from './shop-helpers'

test('campos inválidos mostram o erro no campo e não abrem a revisão', async ({ page }) => {
  await startCheckout(page)
  await page.getByLabel('Nome de exibição').fill('')
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('ana@')
  await page.getByRole('button', { name: 'Confirmar compra' }).click()

  await expect(page.getByLabel('Nome de exibição')).toHaveAccessibleDescription('Use de 2 a 40 caracteres.')
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveAccessibleDescription(
    'Informe um e-mail válido.',
  )
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('sem conectar a carteira não confirma; conectar mostra o endereço', async ({ page }) => {
  await startCheckout(page)
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  await expect(page.getByText('Conecte a carteira para confirmar a compra.').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Conectar MetaMask' })).toBeFocused()
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await connectWallet(page)
  await expect(page.getByText('Carteira conectada: 0xA91F…E82C')).toBeVisible()
})

test('cinco cliques em "Confirmar e pagar" criam um pedido só', async ({ page }) => {
  await startCheckout(page)
  await connectWallet(page)
  const dialog = await openReview(page)
  await expect(dialog.getByText('2.384 ETH')).toBeVisible() // 1.19 × 2 + taxa 0.004

  // Cliques disparados de uma vez, antes de a tela reagir (o botão ainda está habilitado).
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).evaluate((button: HTMLButtonElement) => {
    for (let i = 0; i < 5; i++) button.click()
  })
  await expect(page).toHaveURL(/\/orders\/ord-/)
  expect(await ordersInDb(page)).toBe(1)
})

test('preço muda antes de enviar: o servidor recusa e a revisão pede nova confirmação', async ({
  page,
  mockApi,
}) => {
  await startCheckout(page)
  await connectWallet(page)
  const dialog = await openReview(page)

  // Muda no "servidor" sem evento (o app só descobre ao enviar → 409 QUOTE_STALE).
  await mockApi.postJson('/api/__mock/nft-update', { ...EMERALD_APE, price: '1.5', silent: true })
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()

  await expect(dialog.getByRole('alert')).toContainText('Emerald Ape #042 (1/50): 1.19 ETH → 1.50 ETH.')
  await expect(dialog.getByRole('alert')).toContainText('Total: 2.384 ETH → 3.004 ETH.')
  expect(await ordersInDb(page)).toBe(0)

  await dialog.getByRole('button', { name: 'Aceitar os novos valores' }).click()
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page).toHaveURL(/\/orders\/ord-/)
  const total = await page.evaluate(() => JSON.parse(localStorage.getItem('mock-db')!).orders[0].total)
  expect(total).toBe('3.004')
})

test('preço muda pelo tempo real com a revisão aberta: mostra a diferença na hora', async ({
  page,
  mockApi,
}) => {
  await startCheckout(page)
  await connectWallet(page)
  const dialog = await openReview(page)
  await mockApi.waitForSocket()
  await mockApi.postJson('/api/__mock/nft-update', { ...EMERALD_APE, price: '1.0' })
  await expect(dialog.getByRole('alert')).toContainText('1.19 ETH → 1.00 ETH')
  await expect(dialog.getByRole('button', { name: 'Confirmar e pagar' })).toHaveCount(0)
})

test('cupom aplicado no carrinho chega ao pagamento e ao pedido', async ({ page }) => {
  await startCheckout(page)
  await page.goto('/cart')
  const box = page.getByRole('region', { name: 'Resumo da carteira' })
  await box.getByLabel('Código promocional').fill('DESCONTO10')
  await box.getByRole('button', { name: 'Aplicar' }).click()
  await expect(box.getByText('DESCONTO10')).toBeVisible()
  await box.getByRole('link', { name: 'Conectar e finalizar' }).click()

  await expect(page).toHaveURL('/checkout?cupom=DESCONTO10')
  await expect(page.getByText('(-) 0.238 ETH')).toBeVisible() // 10% de 2.38
  await connectWallet(page)
  const dialog = await openReview(page)
  await expect(dialog.getByText('2.146 ETH')).toBeVisible() // 2.38 − 0.238 + 0.004
})

test('carteira recusada (cenário wallet-reject) mostra o motivo e permite tentar de novo', async ({
  page,
  mockApi,
}) => {
  await mockApi.reset('wallet-reject')
  await startCheckout(page)
  await page.getByRole('button', { name: 'Conectar MetaMask' }).click()
  await expect(page.getByText('A conexão foi recusada na carteira.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
})

test('carteira cai na hora de confirmar (cenário wallet-disconnect)', async ({ page, mockApi }) => {
  await mockApi.reset('wallet-disconnect')
  await startCheckout(page)
  await connectWallet(page)
  const dialog = await openReview(page)
  await dialog.getByRole('button', { name: 'Confirmar e pagar' }).click()
  await expect(page.getByText('A carteira desconectou. Conecte de novo para continuar.')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(await ordersInDb(page)).toBe(0)
})

test('sessão expirada no pagamento: login e volta com os dados preenchidos', async ({ page }) => {
  await startCheckout(page)
  await page.getByLabel('Observação do colecionador (opcional)').fill('Presente para a Bia')
  await page.getByLabel('Nome de exibição').fill('Ana S.')
  // Nenhuma requisição pode estar em voo quando a sessão vencer: ela levaria o 401 antes do clique.
  await page.waitForLoadState('networkidle')

  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('mock-db')!)
    for (const s of db.sessions) s.expiresAt = '2000-01-01T00:00:00.000Z'
    localStorage.setItem('mock-db', JSON.stringify(db))
  })
  await page.getByRole('button', { name: 'Conectar MetaMask' }).click() // a API responde 401

  await expect(page).toHaveURL('/?auth=login&redirect=%2Fcheckout')
  await fillLogin(page, 'ana@example.com')
  await expect(page).toHaveURL('/checkout')
  await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('Presente para a Bia')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Ana S.')
})

test('rascunho do pagamento é de quem o escreveu: outra conta na mesma aba não o recebe', async ({
  page,
  isMobile,
}) => {
  await startCheckout(page) // Ana
  await page.getByLabel('Nome de exibição').fill('Ana S.')
  await logout(page, isMobile)

  await login(page, 'bruno@example.com')
  await addToCart(page, [EMERALD_APE])
  await page.goto('/checkout')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Bruno Lima')
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue('bruno@example.com')
})

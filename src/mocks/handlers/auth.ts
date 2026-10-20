// /api/auth/* — cadastro, login, sessão e logout. Senhas nunca ficam em texto puro:
// o banco guarda só SHA-256 de `${salt}:${senha}`.
import { http } from 'msw'
import type { LoginInput, RegisterInput, Session, User } from '@/api/types'
import { readDb, updateDb, type Db } from '../db'
import type { MockUser } from '../fixtures/users'
import { fail, networkDelay, noContent, ok } from './respond'

const SESSION_TTL_MS = 2 * 60 * 60 * 1000 // 2 horas

export async function hashPassword(salt: string, password: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toUser(user: MockUser): User {
  const { id, username, displayName, email, avatarUrl } = user
  return { id, username, displayName, email, avatarUrl }
}

function createSession(db: Db, user: MockUser): Session {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  db.sessions.push({ token, userId: user.id, expiresAt })
  return { token, user: toUser(user), expiresAt }
}

function bearerToken(request: Request) {
  return request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? null
}

/**
 * Usuário dono do token da requisição. Toda rota autenticada começa por aqui:
 * devolve o usuário ou a resposta 401 pronta (sem sessão ou sessão vencida).
 */
export function requireUser(db: Db, request: Request): MockUser | Response {
  const token = bearerToken(request)
  const session = db.sessions.find((s) => s.token === token)
  if (!session) return fail('UNAUTHORIZED', 'Entre para continuar.')
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return fail('UNAUTHORIZED', 'Sua sessão expirou. Entre novamente.', { reason: 'SESSION_EXPIRED' })
  }
  const user = db.users.find((u) => u.id === session.userId)
  return user ?? fail('UNAUTHORIZED', 'Entre para continuar.')
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME = /^[a-z0-9_.]{3,20}$/i

function validateRegister(input: Partial<RegisterInput>) {
  const fields: Record<string, string> = {}
  if (!USERNAME.test(input.username ?? '')) {
    fields.username = 'Use de 3 a 20 letras, números, "." ou "_".'
  }
  if (!EMAIL.test(input.email ?? '')) fields.email = 'Informe um e-mail válido.'
  if ((input.password ?? '').length < 8) fields.password = 'A senha precisa ter ao menos 8 caracteres.'
  return fields
}

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    await networkDelay()
    const input = (await request.json().catch(() => ({}))) as Partial<RegisterInput>
    const fields = validateRegister(input)
    if (Object.keys(fields).length > 0) return fail('VALIDATION', 'Confira os campos.', { fields })

    const email = input.email!.trim().toLowerCase()
    const username = input.username!.trim()
    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(salt, input.password!)

    return updateDb((db) => {
      if (db.users.some((u) => u.email === email)) {
        return fail('CONFLICT', 'Este e-mail já está cadastrado.', {
          reason: 'EMAIL_TAKEN',
          fields: { email: 'Este e-mail já está cadastrado.' },
        })
      }
      if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        return fail('CONFLICT', 'Este nome de usuário já está em uso.', {
          reason: 'USERNAME_TAKEN',
          fields: { username: 'Este nome de usuário já está em uso.' },
        })
      }
      const user: MockUser = {
        id: `user-${crypto.randomUUID()}`,
        username,
        displayName: username,
        email,
        avatarUrl: null,
        ensName: null,
        walletNickname: null,
        passwordSalt: salt,
        passwordHash,
      }
      db.users.push(user)
      return ok(createSession(db, user), 201)
    })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await networkDelay()
    const input = (await request.json().catch(() => ({}))) as Partial<LoginInput>
    if (!input.email || !input.password) {
      return fail('VALIDATION', 'Informe e-mail e senha.', {
        fields: {
          ...(!input.email && { email: 'Informe o e-mail.' }),
          ...(!input.password && { password: 'Informe a senha.' }),
        },
      })
    }

    const email = input.email.trim().toLowerCase()
    const user = readDb().users.find((u) => u.email === email)
    const valid = user && (await hashPassword(user.passwordSalt, input.password)) === user.passwordHash
    if (!user || !valid) {
      // Mesma resposta para e-mail inexistente e senha errada: não revela quem tem conta.
      return fail('UNAUTHORIZED', 'E-mail ou senha incorretos.', { reason: 'INVALID_CREDENTIALS' })
    }
    return updateDb((db) => ok(createSession(db, user)))
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await networkDelay()
    const db = readDb()
    const user = requireUser(db, request)
    if (user instanceof Response) return user
    const session = db.sessions.find((s) => s.token === bearerToken(request))!
    return ok({ token: session.token, user: toUser(user), expiresAt: session.expiresAt } satisfies Session)
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await networkDelay()
    const token = bearerToken(request)
    updateDb((db) => {
      db.sessions = db.sessions.filter((s) => s.token !== token)
    })
    return noContent()
  }),
]

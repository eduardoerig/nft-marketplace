// /api/profile* — dados do colecionador, avatar e troca de senha (todas exigem sessão).
import { http } from 'msw'
import type { AvatarUpdate, PasswordChange, Profile, ProfileUpdate } from '@/api/types'
import { readDb, updateDb } from '../db'
import type { MockUser } from '../fixtures/users'
import { EMAIL, hashPassword, requireUser, USERNAME } from './auth'
import { fail, noContent, ok } from './respond'

const ENS = /^[a-z0-9-]{3,30}$/ // sem o ".eth"
const AVATAR = /^data:image\/(png|jpeg|webp);base64,/
const AVATAR_MAX_CHARS = 200_000 // ~150 KB: o app reduz a imagem para 256px antes de enviar

function toProfile(user: MockUser): Profile {
  const { id, username, displayName, email, avatarUrl, ensName, walletNickname } = user
  return { id, username, displayName, email, avatarUrl, ensName, walletNickname }
}

function validateProfile(input: ProfileUpdate) {
  const fields: Record<string, string> = {}
  if (input.displayName !== undefined && !/^.{2,40}$/.test(input.displayName.trim())) {
    fields.displayName = 'Use de 2 a 40 caracteres.'
  }
  if (input.username !== undefined && !USERNAME.test(input.username)) {
    fields.username = 'Use de 3 a 20 letras, números, "." ou "_".'
  }
  if (input.email !== undefined && !EMAIL.test(input.email)) fields.email = 'Informe um e-mail válido.'
  if (input.ensName && !ENS.test(input.ensName)) {
    fields.ensName = 'Use de 3 a 30 letras minúsculas, números ou "-".'
  }
  if (input.walletNickname && input.walletNickname.length > 30)
    fields.walletNickname = 'Use até 30 caracteres.'
  return fields
}

export const profileHandlers = [
  http.get('/api/profile', async ({ request }) => {
    const user = requireUser(readDb(), request)
    return user instanceof Response ? user : ok(toProfile(user))
  }),

  http.patch('/api/profile', async ({ request }) => {
    const input = (await request.json().catch(() => ({}))) as ProfileUpdate
    const fields = validateProfile(input)
    if (Object.keys(fields).length > 0) return fail('VALIDATION', 'Confira os campos.', { fields })

    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      const others = db.users.filter((u) => u.id !== user.id)
      const email = input.email?.trim().toLowerCase()
      if (email && others.some((u) => u.email === email)) {
        return fail('CONFLICT', 'Este e-mail já está cadastrado.', {
          reason: 'EMAIL_TAKEN',
          fields: { email: 'Este e-mail já está cadastrado.' },
        })
      }
      const username = input.username?.trim()
      if (username && others.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
        return fail('CONFLICT', 'Este nome de usuário já está em uso.', {
          reason: 'USERNAME_TAKEN',
          fields: { username: 'Este nome de usuário já está em uso.' },
        })
      }
      Object.assign(user, {
        ...(input.displayName !== undefined && { displayName: input.displayName.trim() }),
        ...(username !== undefined && { username }),
        ...(email !== undefined && { email }),
        ...(input.ensName !== undefined && { ensName: input.ensName || null }),
        ...(input.walletNickname !== undefined && { walletNickname: input.walletNickname || null }),
      })
      return ok(toProfile(user))
    })
  }),

  http.post('/api/profile/avatar', async ({ request }) => {
    const { dataUrl } = (await request.json().catch(() => ({}))) as Partial<AvatarUpdate>
    if (dataUrl !== null && (typeof dataUrl !== 'string' || !AVATAR.test(dataUrl))) {
      return fail('VALIDATION', 'Envie uma imagem PNG, JPEG ou WebP.', {
        fields: { avatar: 'Envie uma imagem PNG, JPEG ou WebP.' },
      })
    }
    if (dataUrl && dataUrl.length > AVATAR_MAX_CHARS) {
      return fail('VALIDATION', 'A imagem é grande demais.', {
        fields: { avatar: 'A imagem é grande demais.' },
      })
    }
    return updateDb((db) => {
      const user = requireUser(db, request)
      if (user instanceof Response) return user
      user.avatarUrl = dataUrl
      return ok(toProfile(user))
    })
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const input = (await request.json().catch(() => ({}))) as Partial<PasswordChange>
    const user = requireUser(readDb(), request)
    if (user instanceof Response) return user

    const current = await hashPassword(user.passwordSalt, input.currentPassword ?? '')
    if (current !== user.passwordHash) {
      return fail('VALIDATION', 'A senha atual está incorreta.', {
        reason: 'WRONG_PASSWORD',
        fields: { currentPassword: 'A senha atual está incorreta.' },
      })
    }
    if ((input.newPassword ?? '').length < 8) {
      return fail('VALIDATION', 'Confira os campos.', {
        fields: { newPassword: 'A senha precisa ter ao menos 8 caracteres.' },
      })
    }
    if (input.newPassword === input.currentPassword) {
      return fail('VALIDATION', 'Confira os campos.', {
        fields: { newPassword: 'A nova senha precisa ser diferente da atual.' },
      })
    }
    const salt = crypto.randomUUID()
    const passwordHash = await hashPassword(salt, input.newPassword!)
    updateDb((db) => {
      const stored = db.users.find((u) => u.id === user.id)!
      stored.passwordSalt = salt
      stored.passwordHash = passwordHash
    })
    return noContent()
  }),
]

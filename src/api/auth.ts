import { api } from './client'
import type { LoginInput, RegisterInput, Session } from './types'

export function register(input: RegisterInput) {
  return api.post<Session>('/auth/register', input).then((r) => r.data)
}

export function login(input: LoginInput) {
  return api.post<Session>('/auth/login', input).then((r) => r.data)
}

/** Sessão atual a partir do token salvo. 401 se não houver sessão válida. */
export function getSession(signal?: AbortSignal) {
  return api.get<Session>('/auth/session', { signal }).then((r) => r.data)
}

export function logout() {
  return api.post<void>('/auth/logout').then(() => undefined)
}

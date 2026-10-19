// Cliente HTTP único. Toda chamada REST passa por aqui.
import axios, { AxiosError } from 'axios'
import type { ApiErrorBody, ApiErrorCode, ApiErrorReason } from './types'

const TOKEN_KEY = 'session-token'
const GUEST_CART_KEY = 'guest-cart-id'

/** Erro lançado por todas as funções de src/api — é o tipo de `error` nas queries e mutations. */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly reason?: ApiErrorReason
  readonly fields?: Record<string, string>
  readonly status?: number

  constructor(body: ApiErrorBody, status?: number) {
    super(body.message)
    this.name = 'ApiError'
    this.code = body.code
    this.reason = body.reason
    this.fields = body.fields
    this.status = status
  }
}

// --- Sessão e carrinho de visitante (localStorage) --------------------------

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getGuestCartId() {
  return localStorage.getItem(GUEST_CART_KEY)
}

export function setGuestCartId(id: string | null) {
  if (id) localStorage.setItem(GUEST_CART_KEY, id)
  else localStorage.removeItem(GUEST_CART_KEY)
}

// --- Instância -------------------------------------------------------------

export const api = axios.create({ baseURL: '/api', timeout: 10_000 })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  const guestCartId = getGuestCartId()
  if (guestCartId) config.headers['X-Cart-Id'] = guestCartId
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    // 401 numa requisição autenticada = sessão vencida. Quem cuida da sessão escuta este evento.
    const hadToken = error instanceof AxiosError && Boolean(error.config?.headers?.Authorization)
    if (apiError.code === 'UNAUTHORIZED' && hadToken) {
      window.dispatchEvent(new Event('session-expired'))
    }
    return Promise.reject(apiError)
  },
)

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isCancel(error)) {
    return new ApiError({ code: 'NETWORK', message: 'Requisição cancelada.' })
  }
  if (error instanceof AxiosError) {
    if (error.response) {
      const body = error.response.data as Partial<ApiErrorBody> | undefined
      return new ApiError(
        {
          code: body?.code ?? codeFromStatus(error.response.status),
          reason: body?.reason,
          message: body?.message ?? 'Algo deu errado. Tente novamente.',
          fields: body?.fields,
        },
        error.response.status,
      )
    }
    if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
      return new ApiError({
        code: 'NETWORK',
        reason: 'TIMEOUT',
        message: 'O servidor demorou para responder.',
      })
    }
    return new ApiError({ code: 'NETWORK', reason: 'OFFLINE', message: 'Sem conexão com o servidor.' })
  }
  return new ApiError({ code: 'NETWORK', message: 'Erro inesperado.' })
}

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 422) return 'VALIDATION'
  return 'UNAVAILABLE'
}

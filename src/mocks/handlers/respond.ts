// Respostas padronizadas dos handlers: latência do cenário + formato de erro do docs/API.md.
import { delay, HttpResponse, type JsonBodyType } from 'msw'
import type { ApiErrorBody, ApiErrorCode, ApiErrorReason } from '@/api/types'
import { getScenario } from '../scenarios'

const STATUS: Record<Exclude<ApiErrorCode, 'NETWORK'>, number> = {
  VALIDATION: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAVAILABLE: 503,
}

/** Espera a latência do cenário atual. Chame no início de todo handler. */
export function networkDelay() {
  return delay(getScenario().latencyMs)
}

export function ok<T extends JsonBodyType>(body: T, status = 200) {
  return HttpResponse.json(body, { status })
}

export function noContent() {
  return new HttpResponse(null, { status: 204 })
}

export function fail(
  code: Exclude<ApiErrorCode, 'NETWORK'>,
  message: string,
  extra: { reason?: ApiErrorReason; fields?: Record<string, string> } = {},
) {
  const body: ApiErrorBody = { code, message, ...extra }
  return HttpResponse.json(body, { status: STATUS[code] })
}

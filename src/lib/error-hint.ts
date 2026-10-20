import type { ApiError } from '@/api/client'

/**
 * A frase que explica uma falha de carregamento, conforme o tipo do erro: sem conexão, servidor
 * instável ou demora. Usada nos estados de erro das telas, sempre ao lado de "Tentar novamente".
 */
export function errorHint(error: ApiError | null | undefined): string {
  if (error?.code === 'NETWORK') {
    return error.reason === 'TIMEOUT'
      ? 'O servidor demorou para responder. Tente de novo.'
      : 'Sem conexão com o servidor. Confira sua internet e tente de novo.'
  }
  if (error?.code === 'UNAVAILABLE') return 'O servidor está instável agora. Tente de novo em instantes.'
  return 'Tente de novo em instantes.'
}

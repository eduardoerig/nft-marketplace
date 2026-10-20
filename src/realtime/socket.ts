// Conexão Socket.IO do app: uma por sessão. Com login, vai o token em `auth.token` (o servidor
// manda também os eventos privados daquele usuário); sem login, recebe só os eventos públicos.
import type { Socket } from 'socket.io-client'

let current: { token: string | null; socket: Promise<Socket> } | null = null

/**
 * Devolve o socket da sessão atual, criando um novo se o usuário mudou.
 * - O socket.io-client é importado só aqui (import dinâmico): ele guarda o `WebSocket` do navegador
 *   no momento em que é carregado, e precisa ver o que o MSW instala ao ligar. Também tira ~30 kB
 *   do bundle inicial.
 * - `transports: ['websocket']`: o MSW só intercepta WebSocket, não o long-polling HTTP que o
 *   Socket.IO tenta primeiro por padrão.
 * - `path: '/realtime/'`: ver src/mocks/realtime.ts.
 */
export function connectSocket(token: string | null): Promise<Socket> {
  if (current?.token === token) return current.socket
  disconnectSocket()
  const socket = import('socket.io-client').then(({ io }) =>
    io({ path: '/realtime/', transports: ['websocket'], auth: token ? { token } : {} }),
  )
  current = { token, socket }
  return socket
}

/** Fecha a conexão (logout, sessão expirada, troca de usuário). */
export function disconnectSocket() {
  void current?.socket.then((socket) => socket.disconnect())
  current = null
}

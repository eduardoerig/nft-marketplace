// A tela é desenhada já no carregamento; as chamadas à API (axios e socket) esperam esta promessa.
// Com os mocks ligados, ela resolve quando o MSW passa a interceptar (src/main.tsx); sem mocks, na hora.
// Assim o texto e o layout aparecem enquanto a API simulada ainda está ligando (FCP/LCP menores).
import { useSyncExternalStore } from 'react'

let markReady: () => void = () => {}

export const apiReady = new Promise<void>((resolve) => {
  markReady = resolve
})

// Se o MSW não liga (registro do service worker recusado ou travado), a promessa acima nunca resolve e
// as telas ficariam nos skeletons para sempre. Este estado deixa o layout raiz mostrar o erro no lugar.
let failed = false
const listeners = new Set<() => void>()

function setFailed(value: boolean) {
  if (failed === value) return
  failed = value
  listeners.forEach((listener) => listener())
}

export function setApiReady() {
  markReady()
  setFailed(false) // o MSW pode ligar depois do prazo: a tela de erro some sozinha
}

export function setApiFailed() {
  setFailed(true)
}

/** true quando a API simulada não conseguiu ligar. */
export function useApiFailed() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => failed,
  )
}

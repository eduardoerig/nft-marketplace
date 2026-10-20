// A tela é desenhada já no carregamento; as chamadas à API (axios e socket) esperam esta promessa.
// Com os mocks ligados, ela resolve quando o MSW passa a interceptar (src/main.tsx); sem mocks, na hora.
// Assim o texto e o layout aparecem enquanto a API simulada ainda está ligando (FCP/LCP menores).
let markReady: () => void = () => {}

export const apiReady = new Promise<void>((resolve) => {
  markReady = resolve
})

export function setApiReady() {
  markReady()
}

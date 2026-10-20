import { useState } from 'react'

/**
 * Para diálogos abertos sem um DialogTrigger (pela URL, como o login, ou por estado, como a revisão
 * do pedido): ao fechar, o foco volta para o elemento que estava focado quando o diálogo abriu.
 * Sem isso o foco cairia no <body> e quem usa teclado perderia o lugar na página.
 * Use o retorno em `<DialogContent onCloseAutoFocus={...}>`.
 */
export function useReturnFocus() {
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  return (event: Event) => {
    event.preventDefault()
    if (opener?.isConnected) opener.focus()
  }
}

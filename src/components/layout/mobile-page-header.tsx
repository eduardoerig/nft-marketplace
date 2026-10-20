import { BackButton } from './back-button'

/**
 * Topo das telas internas no mobile (padrão do Figma em Carrinho e Pagamento): voltar + título
 * centralizado. No mobile não há o header do site — a navegação fica na barra inferior.
 * O título aqui é visual: o <h1> de cada tela continua no conteúdo (escondido no mobile quando repete).
 */
export function MobilePageHeader({ title }: { title: string }) {
  return (
    <div className="grid grid-cols-[35px_1fr_35px] items-center gap-2 pb-2 md:hidden">
      <BackButton />
      <p aria-hidden="true" className="text-center text-xl/6 font-bold">
        {title}
      </p>
    </div>
  )
}

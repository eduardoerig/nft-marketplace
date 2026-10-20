import { MobilePageHeader } from './layout/mobile-page-header'

// Conteúdo provisório das rotas do passo 03. Cada tela real substitui o seu uso no passo indicado.
type Props = {
  title: string
  step: string
}

export function PagePlaceholder({ title, step }: Props) {
  return (
    <section className="flex flex-col gap-3 pt-6 pb-16 md:pt-16">
      <MobilePageHeader title={title} />
      <h1 className="text-2xl font-bold max-md:sr-only">{title}</h1>
      <p className="text-sm text-muted-foreground">Tela em construção — chega no passo {step}.</p>
    </section>
  )
}

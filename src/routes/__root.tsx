import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, HeadContent, Link, Outlet } from '@tanstack/react-router'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ meta: [{ title: 'Kurio — Marketplace de NFTs' }] }),
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <TooltipProvider>
      <HeadContent />
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-page flex-1 px-4 outline-none lg:px-0"
        >
          <Outlet />
        </main>
        <SiteFooter />
        <MobileTabBar />
      </div>
      <Toaster />
    </TooltipProvider>
  )
}

function NotFound() {
  return (
    <section className="flex flex-col items-center gap-6 py-24 text-center">
      <p className="text-[43px]/[70px] font-bold text-highlight">404</p>
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="max-w-md text-sm/6 text-muted-foreground">
        O endereço que você abriu não existe ou foi removido. Volte ao início para continuar explorando.
      </p>
      <Button asChild className="uppercase">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </section>
  )
}

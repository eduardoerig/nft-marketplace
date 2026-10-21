import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { Session } from '@/api/types'
import { useReturnFocus } from '@/lib/use-return-focus'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ComingSoonButton } from '@/components/layout/coming-soon'
import { safeRedirect, type AuthMode } from '../routing'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'

const COPY = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    switchText: 'Novo na Kurio? Crie uma conta',
  },
  register: {
    title: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    switchText: 'Já tem uma conta? Entre',
  },
} satisfies Record<AuthMode, unknown>

/**
 * Login e cadastro, abertos por `?auth=login|register` POR CIMA da página atual (ver __root.tsx).
 * Desktop (≥640px): modal de 500px com abas "Entrar | Criar conta".
 * Mobile: o mesmo diálogo ocupa a tela inteira, com o logo grande do Figma.
 * Fechar (X, Esc ou overlay) só tira o parâmetro: a pessoa continua onde estava.
 */
export function AuthDialog({ mode, redirect }: { mode: AuthMode; redirect?: string }) {
  const navigate = useNavigate()
  const copy = COPY[mode]
  const other: AuthMode = mode === 'login' ? 'register' : 'login'
  const returnFocus = useReturnFocus()

  function close() {
    navigate({
      to: '.',
      search: (prev) => ({ ...prev, auth: undefined, redirect: undefined }),
      replace: true,
    })
  }

  function onSuccess(session: Session) {
    toast.success(`Olá, ${session.user.displayName}!`)
    // Veio de uma rota privada? Vai para ela. Senão, fica na página atual.
    if (redirect) navigate({ href: safeRedirect(redirect), replace: true })
    else close()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        onCloseAutoFocus={returnFocus}
        className={cn(
          'flex flex-col gap-0 p-0 sm:max-w-[500px]',
          // Mobile: tela cheia, fundo da página, sem a faixa inferior do modal.
          'max-sm:inset-0 max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none max-sm:border-0 max-sm:bg-background max-sm:px-7 max-sm:pt-20 max-sm:pb-6',
        )}
      >
        <header className="flex flex-col items-center gap-10 text-center sm:px-12 sm:pt-12">
          <p aria-hidden="true" className="text-[32px] font-bold tracking-[0.1em] sm:hidden">
            KURIO
          </p>
          {/* Abas do desktop: trocam só o `?auth=` da URL. */}
          <nav
            aria-label="Entrar ou criar conta"
            className="flex items-center gap-2 text-xl/4 font-medium max-sm:hidden"
          >
            <AuthTab mode="login" active={mode === 'login'}>
              Entrar
            </AuthTab>
            <span aria-hidden="true" className="h-5 w-px bg-destructive" />
            <AuthTab mode="register" active={mode === 'register'}>
              Criar conta
            </AuthTab>
          </nav>
          <div className="flex flex-col gap-10 max-sm:pt-16 sm:gap-0">
            <DialogTitle className="text-lg/4 font-bold sm:sr-only">{copy.title}</DialogTitle>
            <DialogDescription className="text-[13px]/4 text-foreground max-sm:sr-only">
              {copy.description}
            </DialogDescription>
          </div>
        </header>

        <div className="pt-10 sm:px-20 sm:pt-6">
          {mode === 'login' ? <LoginForm onSuccess={onSuccess} /> : <RegisterForm onSuccess={onSuccess} />}
        </div>

        <SocialLogin />

        <Link
          to="."
          search={(prev) => ({ ...prev, auth: other })}
          replace
          className="mt-10 self-center text-[15px] text-muted-foreground hover:text-highlight sm:hidden"
        >
          {copy.switchText}
        </Link>
      </DialogContent>
    </Dialog>
  )
}

function AuthTab({ mode, active, children }: { mode: AuthMode; active: boolean; children: string }) {
  return (
    <Link
      to="."
      search={(prev) => ({ ...prev, auth: mode })}
      replace
      aria-current={active ? 'page' : undefined}
      className={cn('hover:text-highlight', active && 'text-highlight')}
    >
      {children}
    </Link>
  )
}

// "Ou continue com" Google/Facebook — fora do escopo: visível como no Figma, mas "Em breve".
function SocialLogin() {
  return (
    <div className="flex flex-col gap-3 pt-6 sm:pb-16">
      <div className="flex items-center gap-3 text-[13px]/4">
        <span className="h-px flex-1 bg-border" />
        Ou continue com
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="flex flex-col gap-3 max-sm:gap-4 sm:px-20">
        <ComingSoonButton className="flex h-10 items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] font-medium text-muted-foreground">
          <img src="/icons/google.svg" alt="" width={20} height={20} />
          Continuar com Google
        </ComingSoonButton>
        <ComingSoonButton className="flex h-10 items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] font-medium text-muted-foreground">
          <img src="/icons/facebook.svg" alt="" width={10} height={20} />
          Continuar com Facebook
        </ComingSoonButton>
      </div>
    </div>
  )
}

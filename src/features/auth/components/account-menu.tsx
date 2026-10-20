import { Link, useLocation } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import type { User } from '@/api/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout, useSession } from '../queries'

/** Botão "Entrar" do header — ou, logado, o menu da conta (variante não desenhada no Figma). */
export function AccountMenu() {
  const { data: session } = useSession()
  const href = useLocation({ select: (l) => l.href })
  const logout = useLogout()

  if (!session) {
    return (
      <Button asChild size="sm" className="hidden px-2.5 font-medium lg:inline-flex">
        <Link to="/login" search={{ redirect: href }}>
          <img src="/icons/logout.svg" alt="" width={18} height={17} />
          Entrar
        </Link>
      </Button>
    )
  }

  const { user } = session
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Conta de ${user.displayName}`}
          className="hidden items-center gap-2 rounded-full lg:flex"
        >
          <UserAvatar user={user} />
          <span className="max-w-32 truncate text-sm font-medium">{user.displayName}</span>
          <ChevronDownIcon className="size-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{user.displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account/profile">Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account/wallets">Carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout.mutate()}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserAvatar({ user }: { user: User }) {
  return (
    <Avatar className="size-[35px]">
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
      <AvatarFallback className="bg-primary font-bold text-primary-foreground">
        {user.displayName.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}

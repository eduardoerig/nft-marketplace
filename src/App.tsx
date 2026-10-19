// Página temporária do passo 02: confere os componentes base no visual do Figma.
// Será substituída pelas rotas no passo 03.
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <main className="mx-auto flex max-w-page flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-bold tracking-[0.1em]">KURIO</p>
        <h1 className="text-[43px]/[70px] font-bold uppercase">Seja dono do futuro da arte digital</h1>
        <p className="max-w-[557px] text-sm/6 text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="botoes">
        <h2 id="botoes" className="text-lg font-bold">
          Botões
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button className="uppercase">Explorar</Button>
          <Button size="sm">Entrar</Button>
          <Button size="lg">Conectar e finalizar</Button>
          <Button variant="outline">Favoritar</Button>
          <Button variant="link">Esqueceu a senha?</Button>
          <Button disabled>Indisponível</Button>
          <Button variant="secondary" onClick={() => toast.success('Adicionado ao carrinho')}>
            Mostrar toast
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir modal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle className="text-highlight">Entrar</DialogTitle>
              <DialogDescription>Entre para gerenciar sua carteira, coleção e perfil.</DialogDescription>
              <Input type="email" placeholder="contato@email.com" aria-label="E-mail" />
              <Button size="lg">Entrar</Button>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="grid max-w-[763px] gap-6 sm:grid-cols-2" aria-labelledby="campos">
        <h2 id="campos" className="text-lg font-bold sm:col-span-2">
          Campos
        </h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nome">
            Nome de exibição <span className="text-destructive">*</span>
          </Label>
          <Input id="nome" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="carteira">Endereço da carteira</Label>
          <Input id="carteira" placeholder="Endereço 0x da carteira" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            aria-invalid="true"
            aria-describedby="email-erro"
            defaultValue="contato@"
          />
          <p id="email-erro" className="text-sm text-destructive">
            Informe um e-mail válido.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="skeletons">
        <h2 id="skeletons" className="text-lg font-bold">
          Skeleton (shimmer)
        </h2>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {[1, 2, 3].map((card) => (
            <div key={card} className="flex flex-col gap-3">
              <Skeleton className="aspect-258/300 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </section>

      <Toaster />
    </main>
  )
}

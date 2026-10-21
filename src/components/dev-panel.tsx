import { useState, type FormEvent } from 'react'
import { FlaskConicalIcon } from 'lucide-react'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// Painel de testes da API simulada: só existe com VITE_ENABLE_MOCKS=true (carregado sob demanda pelo
// __root). Fala apenas com as rotas de controle /api/__mock/* (pelo Axios) — nada de importar src/mocks aqui.

type ScenarioList = { current: string; scenarios: { name: string; description: string }[] }

const EDITIONS = [
  { id: 'ed-1-1', name: '1/1' },
  { id: 'ed-1-10', name: '1/10' },
  { id: 'ed-1-50', name: '1/50' },
  { id: 'ed-open', name: 'Aberta' },
]

// Pelo mesmo cliente Axios do app (baseURL /api): o erro já chega como ApiError, com a mensagem da API.
async function post(path: string, body?: unknown) {
  await api.post(path, body ?? {})
}

export default function DevPanel() {
  const [list, setList] = useState<ScenarioList | null>(null)
  const [chosen, setChosen] = useState('default')
  const [message, setMessage] = useState('')

  async function load(open: boolean) {
    if (!open) return
    try {
      const { data } = await api.get<ScenarioList>('/__mock/scenarios')
      setList(data)
      setChosen(data.current)
    } catch {
      setMessage('Não foi possível ler os cenários. Recarregue a página.')
    }
  }

  async function run(action: () => Promise<void>, done: string) {
    try {
      await action()
      setMessage(done)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falhou.')
    }
  }

  // Trocar de cenário ou resetar apaga os dados (sessão, carrinho…): recarrega a página do zero.
  const resetTo = (scenario: string) =>
    run(async () => {
      await post('/__mock/reset', { scenario })
      window.location.reload()
    }, 'Recarregando…')

  function updateNft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const price = String(form.get('price') ?? '').trim()
    const available = String(form.get('available') ?? '').trim()
    void run(
      () =>
        post('/__mock/nft-update', {
          nftId: String(form.get('nftId')),
          editionId: String(form.get('editionId')),
          ...(price && { price }),
          ...(available && { available: Number(available) }),
        }),
      'Evento nft.updated emitido.',
    )
  }

  const description = list?.scenarios.find((s) => s.name === chosen)?.description

  return (
    <Sheet onOpenChange={(open) => void load(open)}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Painel de testes da API simulada"
          // Mobile: aba encostada na borda, metade fora da tela — fica só na margem de 16 px e não cobre os cards.
          className="fixed bottom-4 left-4 z-40 rounded-full bg-card opacity-60 hover:opacity-100 focus-visible:opacity-100 max-md:bottom-28 max-md:left-0 max-md:h-10 max-md:w-8 max-md:-translate-x-1/2 max-md:justify-end max-md:pr-0.5 max-md:[&_svg]:size-3.5"
        >
          <FlaskConicalIcon aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-6 overflow-y-auto p-6">
        <SheetHeader className="p-0">
          <SheetTitle>Painel de testes</SheetTitle>
          <SheetDescription>API simulada (MSW). Nada aqui existe no app de verdade.</SheetDescription>
        </SheetHeader>

        <section className="flex flex-col gap-3">
          <Label htmlFor="dev-cenario">Cenário</Label>
          <NativeSelect
            id="dev-cenario"
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
            className="w-full"
          >
            {list?.scenarios.map((s) => (
              <NativeSelectOption key={s.name} value={s.name}>
                {s.name}
                {s.name === list.current ? ' (atual)' : ''}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          <p className="text-xs text-muted-foreground">
            Trocar de cenário ou resetar apaga sessão, carrinho e pedidos.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void resetTo(chosen)}>
              Aplicar cenário
            </Button>
            <Button size="sm" variant="outline" onClick={() => void resetTo(list?.current ?? 'default')}>
              Resetar dados
            </Button>
          </div>
        </section>

        <form onSubmit={updateNft} className="flex flex-col gap-3 border-t border-border pt-5">
          <p className="font-bold">Tempo real: mudar um NFT</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-nft">ID do NFT</Label>
              <Input id="dev-nft" name="nftId" defaultValue="7" inputMode="numeric" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-edicao">Edição</Label>
              <NativeSelect id="dev-edicao" name="editionId" defaultValue="ed-1-50" className="w-full">
                {EDITIONS.map((e) => (
                  <NativeSelectOption key={e.id} value={e.id}>
                    {e.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-preco">Preço (ETH)</Label>
              <Input id="dev-preco" name="price" placeholder="ex.: 1.25" inputMode="decimal" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dev-disponivel">Disponível</Label>
              <Input id="dev-disponivel" name="available" placeholder="ex.: 0" inputMode="numeric" />
            </div>
          </div>
          <Button type="submit" size="sm" className="w-fit">
            Emitir nft.updated
          </Button>
        </form>

        <section className="flex flex-col gap-3 border-t border-border pt-5">
          <p className="font-bold">Conexão do socket</p>
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            onClick={() =>
              void run(() => post('/__mock/disconnect'), 'Socket derrubado: o app reconecta sozinho.')
            }
          >
            Derrubar socket
          </Button>
        </section>

        <p role="status" className="text-sm text-highlight">
          {message}
        </p>
      </SheetContent>
    </Sheet>
  )
}

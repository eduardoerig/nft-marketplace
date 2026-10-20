import type { Nft } from '@/api/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NETWORK_LABELS } from '@/features/catalog/search'

const trigger =
  'h-auto flex-none rounded-none px-0 pb-3 text-[17px]/4 font-normal text-foreground after:bottom-0! after:h-[3px]! after:bg-primary data-active:font-bold data-active:text-highlight'

// Abas "Detalhes do NFT | Avaliações de colecionadores" (Radix: setas do teclado entre abas).
export function NftInfoTabs({ nft }: { nft: Nft }) {
  const network = NETWORK_LABELS[nft.network]
  return (
    <Tabs defaultValue="detalhes" className="gap-3">
      <TabsList
        variant="line"
        className="h-auto w-full flex-wrap justify-start gap-x-8 gap-y-3 border-b border-primary/30 p-0"
      >
        <TabsTrigger value="detalhes" className={trigger}>
          Detalhes do NFT
        </TabsTrigger>
        <TabsTrigger value="avaliacoes" className={trigger}>
          Avaliações<span className="max-md:hidden"> de colecionadores</span> ({nft.reviewCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="detalhes" className="flex flex-col gap-3 text-sm/6 text-muted-foreground">
        <p>
          {nft.name} é uma obra digital da coleção {nft.collection}. Cada atributo fica armazenado nos
          metadados do token e verificado na {network}.
        </p>
        <p>
          A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um
          registro permanente de procedência registrado na rede.
        </p>
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente.</dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>0x7A42...19E8 • Contrato inteligente ERC-721 verificado.</dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="avaliacoes" className="text-sm/6 text-muted-foreground">
        <p>
          Nota média <strong className="text-foreground">{nft.rating.toFixed(1).replace('.', ',')}</strong> de
          5, com base em {nft.reviewCount} avaliações de colecionadores. Os comentários individuais ainda não
          estão disponíveis.
        </p>
      </TabsContent>
    </Tabs>
  )
}

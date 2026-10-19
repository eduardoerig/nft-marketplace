import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useFeaturedNfts } from '../queries'

// Hero da Início. Desktop: texto à esquerda e arte 450×450 à direita. Mobile: card com gradiente.
// Os 3 pontos do Figma alternam entre os NFTs em destaque.
export function HomeHero() {
  const { data: featured } = useFeaturedNfts()
  const [active, setActive] = useState(0)
  const current = featured?.[active]
  const secondary = featured?.[(active + 1) % (featured?.length || 1)]

  return (
    <section
      aria-labelledby="hero-titulo"
      className="relative flex items-center gap-2 overflow-hidden rounded-[30px] bg-linear-to-br from-primary/20 to-primary/10 p-4 md:h-[450px] md:justify-between md:rounded-none md:bg-none md:p-0 md:pl-10"
    >
      <div className="flex max-w-[600px] flex-1 flex-col gap-4 md:gap-11">
        <div className="flex flex-col gap-1.5 md:gap-8">
          <div className="flex flex-col gap-1.5 md:gap-2">
            <p className="text-xs font-medium md:text-sm md:tracking-[0.1em]">Bem-vindo à Kurio</p>
            <h1 id="hero-titulo" className="text-lg/[29px] font-bold uppercase md:text-[43px]/[70px]">
              Seja dono do futuro <br className="max-md:hidden" />
              da arte digital
            </h1>
            <p className="text-xs/[18px] text-muted-foreground md:max-w-[557px] md:text-sm/6">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara,
              apoie artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <Button asChild className="hidden w-fit uppercase md:inline-flex">
            <Link to="/" hash="catalogo" resetScroll={false} activeOptions={{ includeHash: true }}>
              Explorar
            </Link>
          </Button>
          <Link
            to="/"
            hash="catalogo"
            resetScroll={false}
            activeOptions={{ includeHash: true }}
            className="flex items-center gap-2 text-xs font-bold text-highlight md:hidden"
          >
            EXPLORAR
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {featured && featured.length > 1 && (
          <div className="flex gap-1.5 md:justify-end md:gap-4">
            {featured.map((nft, i) => (
              <button
                key={nft.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Destaque ${i + 1} de ${featured.length}: ${nft.name}`}
                aria-pressed={i === active}
                className={cn(
                  'size-[7px] rounded-full bg-primary md:size-2',
                  i !== active && 'opacity-40 hover:opacity-80',
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative w-[138px] shrink-0 md:w-[450px]">
        {current ? (
          <Link to="/nfts/$nftId" params={{ nftId: current.id }} aria-label={`Ver ${current.name}`}>
            <img
              src={current.images[0]}
              alt={current.name}
              width={450}
              height={450}
              fetchPriority="high"
              className="aspect-square w-full rounded-2xl object-cover md:rounded-4xl"
            />
          </Link>
        ) : (
          <Skeleton className="aspect-square w-full rounded-2xl md:rounded-4xl" />
        )}
        {secondary && secondary !== current && (
          <img
            src={secondary.images[0]}
            alt=""
            width={58}
            height={58}
            className="absolute -bottom-2 left-0 size-[58px] rounded-2xl border-2 border-card object-cover md:hidden"
          />
        )}
      </div>
    </section>
  )
}

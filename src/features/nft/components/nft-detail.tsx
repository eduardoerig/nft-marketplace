import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { Nft } from '@/api/types'
import { formatEth, mul } from '@/lib/money'
import { useAddToCartAction } from '@/features/cart/use-add-to-cart'
import { NftShelf } from '@/features/catalog/components/nft-shelf'
import { BackButton } from '@/components/layout/back-button'
import { QuantityStepper } from '@/components/quantity-stepper'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { defaultEditionId } from '../editions'
import { EditionPicker } from './edition-picker'
import { NftGallery } from './nft-gallery'
import { NftInfoTabs } from './nft-info-tabs'

// Tela de detalhe. Desktop: galeria à esquerda e informações à direita. Mobile: imagem no topo,
// "folha" de detalhes e barra de compra fixa embaixo (como no Figma).
export function NftDetail({ nft }: { nft: Nft }) {
  const [editionId, setEditionId] = useState(() => defaultEditionId(nft.editions))
  const [quantity, setQuantity] = useState(1)

  const edition = nft.editions.find((e) => e.id === editionId) ?? nft.editions[0]
  const soldOut = edition.available === 0
  const max = Math.max(1, Math.min(edition.available, edition.maxPerOrder))
  const qty = Math.min(quantity, max) // se a disponibilidade cair, a quantidade acompanha
  const atLimit = qty >= max && !soldOut
  const { add, isPending } = useAddToCartAction()
  const cartInput = { nftId: nft.id, editionId: edition.id, quantity: qty }
  // "Comprar" põe no carrinho e leva até ele (o pagamento exige login e passa pelo carrinho).
  const buy = () => add(cartInput, { goToCart: true })

  return (
    <article className="flex flex-col gap-12 pb-40 md:gap-24 md:pt-8 md:pb-0">
      <div className="flex flex-col gap-3">
        <nav aria-label="Trilha" className="hidden text-[15px]/4 font-bold md:block">
          <Link to="/" className="hover:text-highlight">
            Início
          </Link>
          {' / '}
          <Link to="/" hash="catalogo" activeOptions={{ includeHash: true }} className="hover:text-highlight">
            Mercado
          </Link>
        </nav>

        <div className="flex flex-col md:flex-row md:gap-8">
          <section
            aria-label="Imagens"
            className="-mx-4 bg-linear-to-b from-card to-secondary px-6 pt-4 pb-14 md:mx-0 md:w-[573px] md:shrink-0 md:bg-none md:p-0"
          >
            <MobileTopBar nft={nft} />
            <NftGallery name={nft.name} images={nft.images} />
          </section>

          <section
            aria-labelledby="nft-titulo"
            className="relative -mx-4 -mt-8 flex flex-col gap-5 rounded-t-[31px] bg-card px-6 pt-8 md:mx-0 md:mt-0 md:flex-1 md:rounded-none md:bg-transparent md:p-0"
          >
            <header className="flex flex-col gap-3 border-primary/30 md:border-b md:pb-3">
              <div className="flex items-center justify-between gap-4">
                <h1 id="nft-titulo" className="text-xl font-bold md:text-[28px]">
                  {nft.name}
                </h1>
                <Rating rating={nft.rating} count={nft.reviewCount} variant="pill" />
              </div>
              <div className="hidden items-center justify-between md:flex">
                <p className="text-[22px]/4 font-bold text-highlight">{formatEth(edition.price)}</p>
                <Rating rating={nft.rating} count={nft.reviewCount} variant="stars" />
              </div>
            </header>

            <div className="flex flex-col gap-3">
              <h2 className="hidden text-[15px]/4 font-bold md:block">Sobre este NFT:</h2>
              <p className="text-sm/6 text-muted-foreground">{nft.description}</p>
            </div>

            <EditionPicker editions={nft.editions} value={edition.id} onChange={setEditionId} />

            {/* Desktop: quantidade + ações na mesma linha */}
            <div className="hidden flex-wrap items-center justify-between gap-4 md:flex">
              <QuantityControl
                qty={qty}
                max={max}
                soldOut={soldOut}
                atLimit={atLimit}
                onChange={setQuantity}
                name={nft.name}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={buy}
                  disabled={soldOut || isPending}
                  className="h-10 w-[130px] rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  COMPRAR
                </button>
                <FavoriteButton nftId={nft.id} nftName={nft.name} variant="label" />
              </div>
            </div>

            <dl className="flex flex-col gap-3 text-[15px] text-placeholder">
              <div className="flex gap-1">
                <dt>ID do token:</dt>
                <dd>{nft.tokenId}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Coleção:</dt>
                <dd>{nft.collection}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Atributos:</dt>
                <dd>{nft.attributes.join(', ')}</dd>
              </div>
            </dl>

            <ShareLinks name={nft.name} />
          </section>
        </div>
      </div>

      <NftInfoTabs nft={nft} />
      {/* "Mais desta coleção": mesma categoria, mais populares primeiro, sem o NFT aberto. */}
      <NftShelf
        id="relacionados"
        title="Mais desta coleção"
        params={{ category: nft.category, sort: 'popular' }}
        excludeId={nft.id}
      />

      {/* Mobile: barra de compra fixa */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-5 rounded-t-[40px] bg-card px-6 pt-5 pb-9 shadow-overlay md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-medium text-muted-foreground">Qtd.</span>
            <QuantityStepper
              value={qty}
              max={max}
              onChange={setQuantity}
              label={nft.name}
              size="sm"
              disabled={soldOut}
            />
          </div>
          <p className="text-xl font-bold text-highlight" aria-live="polite">
            <span className="sr-only">Total: </span>
            {formatEth(mul(edition.price, qty))}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={buy}
            disabled={soldOut || isPending}
            className="h-[60px] flex-1 rounded-[40px] bg-linear-to-r from-primary to-primary/80 font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Comprar NFT
          </button>
          <button
            type="button"
            onClick={() => add(cartInput)}
            disabled={soldOut || isPending}
            aria-label="Adicionar ao carrinho"
            className="flex size-[60px] items-center justify-center rounded-full border bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <img src="/icons/shop.svg" alt="" width={20} height={20} />
          </button>
        </div>
      </div>
    </article>
  )
}

function QuantityControl(props: {
  qty: number
  max: number
  soldOut: boolean
  atLimit: boolean
  name: string
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <QuantityStepper
        value={props.qty}
        max={props.max}
        onChange={props.onChange}
        label={props.name}
        disabled={props.soldOut}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {props.soldOut
          ? 'Edição esgotada — escolha outra.'
          : props.atLimit
            ? `Limite: ${props.max} por pedido.`
            : `Até ${props.max} por pedido.`}
      </p>
    </div>
  )
}

function Rating({ rating, count, variant }: { rating: number; count: number; variant: 'pill' | 'stars' }) {
  const label = `Nota ${rating.toFixed(1).replace('.', ',')} de 5, ${count} avaliações`
  if (variant === 'pill') {
    return (
      <p
        aria-label={label}
        className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-1 text-sm md:hidden"
      >
        <img src="/icons/bold-star.svg" alt="" width={14} height={14} />
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-muted-foreground">({count})</span>
      </p>
    )
  }
  return (
    <p aria-label={label} className="flex items-center gap-1 text-[15px]">
      {Array.from({ length: 5 }, (_, i) => (
        <img
          key={i}
          src="/icons/bold-star.svg"
          alt=""
          width={15}
          height={15}
          className={i < Math.round(rating) ? '' : 'opacity-25'}
        />
      ))}
      <span className="ml-1">{count} avaliações de colecionadores</span>
    </p>
  )
}

function ShareLinks({ name }: { name: string }) {
  const url = typeof window === 'undefined' ? '' : window.location.href
  const text = encodeURIComponent(`${name} na Kurio`)
  const links = [
    {
      label: 'LinkedIn',
      icon: 'social-linkedin',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    { label: 'E-mail', icon: 'message', href: `mailto:?subject=${text}&body=${encodeURIComponent(url)}` },
    {
      label: 'Twitter',
      icon: 'social-twitter',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
    },
  ]
  return (
    <div className="hidden items-center gap-2 md:flex">
      <span className="text-[15px]/4 font-bold">Compartilhar este NFT:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target={l.href.startsWith('mailto') ? undefined : '_blank'}
          rel="noopener noreferrer"
          aria-label={`Compartilhar no ${l.label}`}
          className="rounded-sm p-0.5 hover:opacity-80"
        >
          <img src={`/icons/${l.icon}.svg`} alt="" width={16} height={16} />
        </a>
      ))}
    </div>
  )
}

// Mobile: voltar + favoritar sobre a imagem.
function MobileTopBar({ nft }: { nft: Nft }) {
  return (
    <div className="mb-3 flex justify-between md:hidden">
      <BackButton />
      <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" className="size-[35px] border" />
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import type { CatalogSearch } from '../search'

const PROMOS: {
  title: string
  text: string
  image: string
  search: Partial<CatalogSearch>
}[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/nft-art-1.png',
    search: { view: 'new' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/nft-art-3.png',
    search: { category: 'digital-art' },
  },
]

// Dois cards promocionais; o "Explorar" aplica o filtro correspondente no catálogo.
export function HomePromos() {
  return (
    <section aria-label="Destaques do mercado" className="grid gap-6 md:grid-cols-2 md:gap-7">
      {PROMOS.map((promo) => (
        <article
          key={promo.title}
          className="relative flex min-h-[250px] overflow-hidden rounded-xl bg-card max-sm:flex-col"
        >
          <img
            src={promo.image}
            alt=""
            width={292}
            height={250}
            loading="lazy"
            className="h-[200px] w-full rounded-[18px] object-cover sm:h-auto sm:w-1/2"
          />
          <div className="flex flex-1 flex-col items-end justify-center gap-4 p-6 text-right">
            <h3 className="max-w-[230px] text-lg/6 font-bold">{promo.title}</h3>
            <p className="max-w-[263px] text-sm/6 text-muted-foreground">{promo.text}</p>
            <Link
              from="/"
              to="/"
              search={{ ...promo.search }}
              hash="catalogo"
              activeOptions={{ includeHash: true }}
              className="inline-flex h-10 w-[140px] items-center justify-center gap-1 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/85"
            >
              Explorar
              <img src="/icons/curved-arrow-right.svg" alt="" width={18} height={18} />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}

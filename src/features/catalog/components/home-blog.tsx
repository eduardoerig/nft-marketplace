import { ComingSoon } from '@/components/layout/coming-soon'

// "Diário da Cunhagem": conteúdo editorial, fora do escopo do desafio — os cards aparecem como no
// Figma, mas o "Ler mais" fica desabilitado ("Em breve").
const POSTS = [
  {
    meta: '12 de setembro | Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nft-art-3.png',
  },
  {
    meta: '13 de setembro | Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/nft-art-1.png',
  },
  {
    meta: '15 de setembro | Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/nft-art-2.png',
  },
  {
    meta: '15 de setembro | Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nft-art-4.png',
  },
]

export function HomeBlog() {
  return (
    <section aria-labelledby="blog-titulo" className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="blog-titulo" className="text-[28px] font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title} className="flex flex-col overflow-hidden rounded-xl bg-card">
            <img
              src={post.image}
              alt=""
              width={268}
              height={195}
              loading="lazy"
              className="aspect-268/195 w-full object-cover object-top"
            />
            <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
              <p className="text-xs/4 font-medium text-muted-foreground">{post.meta}</p>
              <h3 className="text-base font-bold">{post.title}</h3>
              <p className="flex-1 text-xs/4 font-medium text-muted-foreground">{post.text}</p>
              <ComingSoon className="w-fit text-xs font-bold text-highlight">Ler mais →</ComingSoon>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

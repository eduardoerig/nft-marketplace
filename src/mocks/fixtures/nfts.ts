// ~60 NFTs determinísticos (sem aleatoriedade): os 9 primeiros são os do Figma; o resto é gerado
// por combinação, com variedade de categoria, rede, preço, edições esgotadas e selo "RARO".
import { CATEGORIES, NETWORKS, type Nft, type NftEdition } from '@/api/types'
import { mul } from '@/lib/money'

// As 4 artes do Figma (public/images): 1 macaco de óculos, 2 gorila de chapéu,
// 3 macaco de terno, 4 macaco com fones.
const ART = [
  '/images/nft-art-1.png',
  '/images/nft-art-2.png',
  '/images/nft-art-3.png',
  '/images/nft-art-4.png',
]

type Seed = {
  name: string
  price: string
  art: number // 1–4
  previousPrice?: string
  rare?: boolean
  rating?: number
  reviewCount?: number
}

// Exatamente como no Figma (Início, detalhe e carrinho).
const FIGMA: Seed[] = [
  { name: 'Emerald Ape #042', price: '1.19', art: 1, rating: 4.8, reviewCount: 19 },
  { name: 'Sage Nomad #009', price: '1.69', art: 2 },
  { name: 'Neon Vessel #552', price: '1.99', art: 3, previousPrice: '2.29', rare: true },
  { name: 'Cosmic Bloom #118', price: '1.29', art: 2 },
  { name: 'Violet Nomad #314', price: '1.39', art: 2 },
  { name: 'Ivory Baron #088', price: '1.79', art: 3 },
  { name: 'Golden Beat #207', price: '0.99', art: 4 },
  { name: 'Golden Frequency #071', price: '0.59', art: 4 },
  { name: 'Golden Signal #160', price: '0.39', art: 4 },
]

const ADJECTIVES = ['Amber', 'Crimson', 'Silent', 'Lunar', 'Velvet', 'Rust', 'Copper', 'Midnight', 'Solar']
const NOUNS = ['Ape', 'Nomad', 'Baron', 'Signal', 'Vessel', 'Bloom']
const ART_BY_NOUN: Record<string, number> = { Ape: 1, Nomad: 2, Baron: 3, Vessel: 3, Signal: 4, Bloom: 2 }

function generatedSeeds(count: number): Seed[] {
  return Array.from({ length: count }, (_, i) => {
    const noun = NOUNS[i % NOUNS.length]
    const adjective = ADJECTIVES[Math.floor(i / NOUNS.length) % ADJECTIVES.length]
    const number = String((i * 37 + 11) % 1000).padStart(3, '0')
    // Preços de 0.05 a 12.30 ETH, espalhados (faixa do filtro do Figma: 0,02 – 12,30).
    const cents = 5 + ((i * 263) % 1226)
    return {
      name: `${adjective} ${noun} #${number}`,
      price: (cents / 100).toFixed(2),
      art: ART_BY_NOUN[noun],
      previousPrice: i % 9 === 4 ? ((cents + 40) / 100).toFixed(2) : undefined,
      rare: i % 7 === 3,
    }
  })
}

const DAY = 24 * 60 * 60 * 1000
const LISTED_BASE = Date.UTC(2026, 8, 30) // 30/09/2026: o mais recente

function editionsFor(index: number, price: string): NftEdition[] {
  // A cada 5 NFTs uma edição esgota; a cada 13 o 1/1 está esgotado.
  const soldOut = index % 5 === 2 ? '1/10' : null
  return [
    { id: 'ed-1-1', name: '1/1', price: mul(price, 4), available: index % 13 === 6 ? 0 : 1, maxPerOrder: 1 },
    {
      id: 'ed-1-10',
      name: '1/10',
      price: mul(price, 2),
      available: soldOut === '1/10' ? 0 : 6,
      maxPerOrder: 3,
    },
    { id: 'ed-1-50', name: '1/50', price, available: 32, maxPerOrder: 10 },
    { id: 'ed-open', name: 'Aberta', price, available: 999, maxPerOrder: 20 },
  ]
}

function toNft(seed: Seed, index: number): Nft {
  const id = String(index + 1)
  const number = seed.name.split('#')[1]
  const main = ART[seed.art - 1]
  return {
    id,
    name: seed.name,
    tokenId: `#0${number}`,
    collection: `Kurio ${seed.name.split(' ')[1].replace(/#.*/, '')}s`,
    category: CATEGORIES[index % CATEGORIES.length],
    // Rede independente da categoria, para os filtros combinados sempre terem resultados.
    network: NETWORKS[Math.floor(index / CATEGORIES.length) % NETWORKS.length],
    images: [main, ...ART.filter((a) => a !== main)],
    description: `${seed.name} é uma obra digital finalizada à mão da coleção Kurio Editions, verificada na rede, com arte desbloqueável e acesso para colecionadores.`,
    attributes: ['Óculos', 'Esmeralda', 'Raro'].slice(0, 1 + (index % 3)),
    rating: seed.rating ?? 3 + (index % 3) * 0.5 + (index % 2) * 0.4,
    reviewCount: seed.reviewCount ?? 5 + ((index * 17) % 60),
    rare: seed.rare ?? false,
    price: seed.price,
    previousPrice: seed.previousPrice ?? null,
    editions: editionsFor(index, seed.price),
    listedAt: new Date(LISTED_BASE - index * 2 * DAY).toISOString(),
    version: 1,
  }
}

export const nftFixtures: Nft[] = [...FIGMA, ...generatedSeeds(51)].map(toNft)

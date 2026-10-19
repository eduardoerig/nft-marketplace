import { Link } from '@tanstack/react-router'
import { ComingSoon } from './coming-soon'

const FEATURES = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

// Só "Meu perfil" e as coleções levam a telas do desafio; o resto é "Em breve".
const PROFILE_LINKS = ['Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']
const HELP_LINKS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]
const COLLECTIONS = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']
const SOCIALS = [
  { label: 'Facebook', icon: 'social-facebook', width: 8, height: 16 },
  { label: 'Instagram', icon: 'social-instagram', width: 16, height: 16 },
  { label: 'Twitter', icon: 'social-twitter', width: 16, height: 13 },
  { label: 'LinkedIn', icon: 'social-linkedin', width: 16, height: 15 },
  { label: 'YouTube', icon: 'social-youtube', width: 19, height: 14 },
]

const columnTitle = 'text-base/4 font-bold md:text-lg/4'
const columnList = 'flex flex-col text-sm/7 md:text-sm/[30px]'

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-12 w-full max-w-page px-4 pb-32 md:mt-24 md:pb-6 lg:px-0">
      {/* Benefícios + newsletter — só a partir de tablet: no celular o footer fica enxuto. */}
      <div className="hidden gap-8 bg-card p-8 md:grid md:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_1.35fr] lg:gap-0">
        {FEATURES.map((f) => (
          <div key={f.mark} className="flex flex-col gap-3 border-primary lg:border-r lg:px-4">
            <span
              aria-hidden="true"
              className="flex size-[74px] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
            >
              {f.mark}
            </span>
            <h2 className="text-[17px]/4 font-bold">{f.title}</h2>
            <p className="max-w-[204px] text-sm/[22px] text-muted-foreground">{f.text}</p>
          </div>
        ))}
        <div className="flex flex-col gap-4 lg:px-4">
          <h2 className="text-lg/4 font-bold">Antecipe-se ao próximo lançamento</h2>
          <div className="flex h-10 overflow-hidden rounded-lg bg-surface-dark shadow-overlay">
            <label htmlFor="newsletter" className="sr-only">
              E-mail para a newsletter
            </label>
            <input
              id="newsletter"
              type="email"
              disabled
              placeholder="digite seu e-mail..."
              className="min-w-0 flex-1 bg-transparent px-3 text-sm placeholder:text-placeholder disabled:cursor-not-allowed"
            />
            <ComingSoon className="flex items-center bg-primary px-4 text-lg font-bold text-primary-foreground opacity-100">
              Enviar
            </ComingSoon>
          </div>
          <p className="text-[13px]/[22px] text-muted-foreground">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </div>
      </div>

      {/* Faixa de contato */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-surface-dark p-5 text-sm/[22px] md:gap-4 md:p-8 lg:grid-cols-4 lg:items-center">
        <Link to="/" className="font-bold tracking-[0.1em] max-md:col-span-2 max-md:mb-1">
          KURIO
        </Link>
        <p className="whitespace-pre-line max-md:hidden">
          {'Feito para colecionadores,\ncriadores e cultura'}
        </p>
        <a href="mailto:contato@email.com" className="hover:text-highlight">
          contato@email.com
        </a>
        <a href="tel:+551140028922" className="hover:text-highlight">
          +55 11 4002 8922
        </a>
      </div>

      {/* Links */}
      {/* No celular ficam só os links que levam a telas reais; os "Em breve" aparecem a partir de tablet. */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 bg-card p-5 md:gap-10 md:p-8 lg:grid-cols-4">
        <nav aria-labelledby="footer-perfil" className="flex flex-col gap-2">
          <h2 id="footer-perfil" className={columnTitle}>
            Meu perfil
          </h2>
          <ul className={columnList}>
            <li>
              <Link to="/account/profile" className="hover:text-highlight">
                Meu perfil
              </Link>
            </li>
            {PROFILE_LINKS.map((label) => (
              <li key={label} className="max-md:hidden">
                <ComingSoon>{label}</ComingSoon>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-ajuda" className="flex flex-col gap-2 max-md:hidden">
          <h2 id="footer-ajuda" className={columnTitle}>
            Central de ajuda
          </h2>
          <ul className={columnList}>
            {HELP_LINKS.map((label) => (
              <li key={label}>
                <ComingSoon>{label}</ComingSoon>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-colecoes" className="flex flex-col gap-2">
          <h2 id="footer-colecoes" className={columnTitle}>
            Coleções
          </h2>
          <ul className={columnList}>
            {COLLECTIONS.map((label) => (
              <li key={label}>
                <Link
                  to="/"
                  hash="catalogo"
                  activeOptions={{ includeHash: true }}
                  className="hover:text-highlight"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-6 max-md:col-span-2 max-md:flex-row max-md:flex-wrap max-md:justify-between md:gap-8">
          <div className="flex flex-col gap-3 md:gap-5">
            <h2 className={columnTitle}>Redes sociais</h2>
            <ul className="flex gap-2.5">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <ComingSoon className="flex size-[30px] items-center justify-center rounded-sm border border-primary opacity-100">
                    <img src={`/icons/${s.icon}.svg`} alt="" width={s.width} height={s.height} />
                    <span className="sr-only">{s.label}</span>
                  </ComingSoon>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className={columnTitle}>Carteiras compatíveis</h2>
            <p className="w-fit rounded-lg border border-border-soft bg-surface-dark px-2 py-2 text-[9px] font-bold tracking-[0.01em] text-highlight">
              METAMASK • WALLETCONNECT • COINBASE
            </p>
          </div>
        </div>
      </div>

      <p className="py-1 text-center text-sm/[30px]">© 2026 Kurio. Propriedade digital para todos.</p>
    </footer>
  )
}

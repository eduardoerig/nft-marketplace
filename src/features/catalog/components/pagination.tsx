import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

type Props = { page: number; totalPages: number }

/** Números de página a mostrar: todas se forem poucas; senão 1 … vizinhas … última. */
function pageList(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (['gap', p] as const) : [p]))
}

const box = 'flex size-[35px] items-center justify-center rounded-sm text-lg/4'

function PageLink(props: { page: number; label: string; current?: boolean; children: ReactNode }) {
  return (
    <Link
      from="/"
      to="/"
      search={(prev) => ({ ...prev, page: props.page })}
      hash="catalogo" // leva o foco visual de volta ao topo do catálogo
      activeOptions={{ exact: true }}
      aria-label={props.label}
      aria-current={props.current ? 'page' : undefined}
      className={cn(
        box,
        props.current ? 'bg-primary font-bold text-primary-foreground' : 'border hover:border-primary',
      )}
    >
      {props.children}
    </Link>
  )
}

export function Pagination({ page, totalPages }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="flex justify-end">
      <ul className="flex gap-2">
        {page > 1 && (
          <li>
            <PageLink page={page - 1} label="Página anterior">
              <img src="/icons/curved-arrow-left-2.svg" alt="" width={18} height={18} />
            </PageLink>
          </li>
        )}
        {pageList(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true" className={box}>
              …
            </li>
          ) : (
            <li key={p}>
              <PageLink page={p} label={`Página ${p}`} current={p === page}>
                {p}
              </PageLink>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <PageLink page={page + 1} label="Próxima página">
              <img src="/icons/curved-arrow-right-2.svg" alt="" width={18} height={18} />
            </PageLink>
          </li>
        )}
      </ul>
    </nav>
  )
}

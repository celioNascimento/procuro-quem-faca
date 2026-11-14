import { Skeleton } from './Skeleton'

// Os esqueletos desta tela seguem as medidas da lista de verdade (card compacto de ~110 px,
// 1 coluna no celular e 2 no desktop, mesmos espaços do topo). Assim, quando os resultados chegam,
// nada pula de lugar. Se mudar o card em PrestadorCard, ajuste aqui também.

/** Cartões de carregamento: usados dentro da página enquanto a busca carrega e no esqueleto inicial. */
export function CardsSkeleton({ quantidade = 4 }: { quantidade?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-3 motion-safe:animate-pulse lg:grid-cols-2"
      aria-busy="true"
      aria-label="Carregando profissionais"
    >
      {Array.from({ length: quantidade }, (_, i) => (
        <div
          key={i}
          className="flex min-h-[110px] items-center gap-4 rounded-[2rem] border border-slate-100 bg-white px-4 py-4 shadow-sm md:px-5"
        >
          <Skeleton className="size-16 shrink-0 rounded-2xl md:size-20" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3 bg-slate-100" />
            <Skeleton className="h-3 w-1/2 bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Esqueleto da página toda (usado até a leitura da URL terminar): coluna de filtros, título e cartões. */
export function ListaSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-3 md:px-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6" aria-busy="true">
      <aside className="hidden space-y-3 lg:block" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-12 rounded-2xl border border-slate-100 bg-white motion-safe:animate-pulse" />
        ))}
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="border-l-4 border-slate-200 py-1 pl-4 motion-safe:animate-pulse">
          <Skeleton className="h-5 w-56 max-w-full" />
          <div className="mt-2.5 flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-36 bg-slate-100" />
            <Skeleton className="h-6 w-28 rounded-full bg-slate-100" />
          </div>
        </div>
        <CardsSkeleton />
      </div>
    </div>
  )
}

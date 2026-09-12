import { Skeleton } from './Skeleton'

export function ListaSkeleton() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-6 md:px-6" aria-busy="true" aria-label="Carregando profissionais">
      <div className="mb-6 flex items-center justify-between border-l-4 border-slate-200 py-1 pl-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-28 bg-slate-100" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <article key={item} className="flex min-h-32 gap-4 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
            <Skeleton className="size-20 shrink-0 rounded-2xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2 bg-slate-100" />
              </div>
              <div className="mt-auto flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full bg-slate-100" />
                <Skeleton className="h-6 w-28 rounded-full bg-slate-100" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

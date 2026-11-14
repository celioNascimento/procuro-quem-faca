import { Skeleton } from './Skeleton'

export default function PainelDoClienteSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans antialiased" aria-busy="true" aria-label="Carregando painel do cliente">
      <nav className="fixed inset-x-0 top-0 z-[100] h-16 border-b border-slate-100 bg-white md:h-18">
        <div className="mx-auto grid h-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 md:gap-4">
          <Skeleton className="size-11 rounded-xl bg-slate-100" />
          <Skeleton className="h-10 w-36 bg-slate-100 md:w-52" />
          <Skeleton className="ml-auto size-11 rounded-xl bg-slate-100" />
        </div>
      </nav>
      <div className="mx-auto max-w-5xl px-5 pb-10 pt-20 md:pt-26">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8">
          <Skeleton className="h-3 w-24 bg-blue-100" />
          <Skeleton className="h-8 w-72 rounded-lg" />
          <Skeleton className="h-4 w-full max-w-lg bg-slate-100" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="shrink-0 rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm lg:w-72">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 shrink-0 rounded-2xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-2/3 bg-slate-100" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <Skeleton className="h-3 w-3/4 bg-slate-100" />
              <Skeleton className="h-3 w-1/2 bg-slate-100" />
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <Skeleton className="h-32 rounded-[2rem]" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((item) => <Skeleton key={item} className="h-24 rounded-2xl" />)}
            </div>
            <div className="flex h-14 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5">
              <Skeleton className="flex-1 rounded-xl" />
              <Skeleton className="flex-1 rounded-xl bg-slate-100" />
            </div>
            <div className="flex gap-2 overflow-hidden">
              {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-10 w-28 shrink-0 rounded-xl bg-slate-100" />)}
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {[0, 1, 2].map((item) => <Skeleton key={item} className="h-40 rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-100" />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

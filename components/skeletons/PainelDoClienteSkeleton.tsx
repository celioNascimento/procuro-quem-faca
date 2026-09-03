export default function PainelDoClienteSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-12 font-sans antialiased" aria-busy="true" aria-label="Carregando painel do cliente">
      <nav className="fixed inset-x-0 top-0 z-[100] h-16 border-b border-slate-100 bg-white/95 backdrop-blur-md md:h-28">
        <div className="mx-auto flex h-full max-w-5xl animate-pulse items-center justify-between px-4">
          <div className="h-10 w-10 rounded-xl bg-slate-100 md:h-11 md:w-11" />
          <div className="h-10 w-40 rounded-md bg-slate-100 md:h-14 md:w-56" />
          <div className="h-10 w-10 rounded-xl bg-slate-100 md:h-11 md:w-11" />
        </div>
      </nav>

      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-20 sm:px-6 md:pt-32 lg:px-8">
        <header className="mb-6 max-w-2xl animate-pulse space-y-3 sm:mb-8">
          <div className="h-2.5 w-24 rounded bg-blue-100" />
          <div className="h-8 w-72 rounded-lg bg-slate-200 sm:h-9" />
          <div className="h-4 w-full max-w-lg rounded bg-slate-100" />
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="animate-pulse rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm lg:sticky lg:top-32">
            <div className="flex items-center gap-4">
              <div className="size-16 shrink-0 rounded-2xl bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-slate-100" />
                <div className="h-4 w-full rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-5 h-3 w-3/4 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
          </aside>

          <div className="flex min-w-0 flex-col gap-6">
            <div className="h-32 animate-pulse rounded-[2rem] bg-slate-200/70" />

            <div className="flex animate-pulse snap-x gap-3 overflow-hidden sm:grid sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 min-w-[calc(100vw-2.5rem)] shrink-0 rounded-2xl bg-slate-200 sm:min-w-0" />
              ))}
            </div>

            <div className="flex h-14 animate-pulse gap-2 rounded-2xl border border-slate-200 bg-white p-1.5">
              <div className="flex-1 rounded-xl bg-slate-200" />
              <div className="flex-1 rounded-xl bg-slate-100" />
            </div>

            <div className="flex gap-2 overflow-hidden animate-pulse">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 w-28 shrink-0 rounded-xl bg-slate-100" />)}
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-100" />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

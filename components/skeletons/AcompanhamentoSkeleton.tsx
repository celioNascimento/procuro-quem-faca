// components/skeletons/AcompanhamentoSkeleton.tsx

export default function AcompanhamentoSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">

      {/* Header Skeleton — espelha o HeaderCliente fixo (mesma altura/estrutura) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-100 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 md:h-28 flex items-center justify-between animate-pulse">
          {/* Botão voltar */}
          <div className="w-10 md:w-32 flex justify-start items-center shrink-0">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-slate-100" />
          </div>

          {/* Logo central */}
          <div className="flex-1 flex justify-center items-center px-2">
            <div className="h-10 md:h-14 w-32 md:w-44 rounded-md bg-slate-100" />
          </div>

          {/* Nome + logout */}
          <div className="w-10 md:w-32 flex justify-end items-center gap-2 shrink-0">
            <div className="hidden md:flex flex-col items-end gap-1.5">
              <div className="h-2 w-10 rounded bg-slate-100" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-slate-100" />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-36 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* Aside — CardPrestador + StatusMini + RodapeSeguranca */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-4">

            {/* CardPrestador skeleton */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 sm:p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl bg-slate-200" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-3/4 rounded-md bg-slate-200" />
                  <div className="h-3 w-1/2 rounded-md bg-slate-100" />
                </div>
              </div>
              <div className="h-8 w-24 rounded-full bg-slate-100" />
              <div className="h-11 w-full rounded-full bg-slate-100" />
            </div>

            {/* StatusMini skeleton */}
            <div className="grid grid-cols-2 gap-3 animate-pulse">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-100 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-2 w-3/4 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>

            {/* RodapeSeguranca skeleton — só some no mobile, igual ao original */}
            <div className="hidden lg:block bg-slate-900/90 rounded-[2rem] p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-full rounded bg-white/10" />
                  <div className="h-2.5 w-2/3 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </aside>

          {/* Coluna principal — LinhaDeTempo */}
          <div className="flex-1 min-w-0 space-y-5">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 sm:p-6 space-y-5 animate-pulse">

              {/* Cabeçalho: título + badge */}
              <div className="flex items-center justify-between">
                <div className="h-2.5 w-28 sm:w-32 rounded bg-slate-100" />
                <div className="h-5 w-20 sm:w-24 rounded-full bg-slate-100" />
              </div>

              {/* 3 nós da timeline: Antes / Durante / Depois */}
              <div className="space-y-4 sm:space-y-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3 sm:gap-4">
                    {/* Marcador da timeline vertical */}
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <div className="w-3 h-3 rounded-full bg-slate-200" />
                      {i < 2 && <div className="w-px flex-1 min-h-[3.5rem] sm:min-h-[4.5rem] bg-slate-100 mt-1" />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="h-3 w-14 rounded bg-slate-200" />
                          <div className="h-2 w-20 rounded bg-slate-100" />
                        </div>
                      </div>
                      <div className="w-full aspect-video rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Instrução no rodapé */}
              <div className="pt-1 border-t border-slate-50 flex justify-center">
                <div className="h-2.5 w-3/4 sm:w-2/3 rounded bg-slate-100" />
              </div>
            </div>

            {/* RodapeSeguranca no mobile — mesma posição do original (lg:hidden) */}
            <div className="lg:hidden bg-slate-900/90 rounded-[2rem] p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-full rounded bg-white/10" />
                  <div className="h-2.5 w-2/3 rounded bg-white/10" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

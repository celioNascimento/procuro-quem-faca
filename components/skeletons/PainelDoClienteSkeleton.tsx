// components/skeletons/PainelDoClienteSkeleton.tsx

export default function PainelDoClienteSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-32 font-sans antialiased">

      {/* Header Skeleton — espelha o HeaderCliente fixo (mesma altura/estrutura) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-100 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 md:h-28 flex items-center justify-between animate-pulse">
          <div className="w-10 md:w-32 flex justify-start items-center shrink-0">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-slate-100" />
          </div>
          <div className="flex-1 flex justify-center items-center px-2">
            <div className="h-10 md:h-14 w-32 md:w-44 rounded-md bg-slate-100" />
          </div>
          <div className="w-10 md:w-32 flex justify-end items-center gap-2 shrink-0">
            <div className="hidden md:flex flex-col items-end gap-1.5">
              <div className="h-2 w-10 rounded bg-slate-100" />
              <div className="h-3 w-16 rounded bg-slate-100" />
            </div>
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-slate-100" />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 pt-24 md:pt-36">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ── Coluna Esquerda ── */}
          <div className="w-full lg:w-1/3 shrink-0">
            <div className="lg:sticky lg:top-36 flex flex-col gap-6">

              {/* Card do prestador — espelha o card real (avatar + categoria + nome) */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-4 sm:p-5 flex items-center gap-4 animate-pulse">
                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[1.25rem] bg-slate-200" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-2.5 w-24 rounded bg-blue-100/60" />
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                </div>
              </div>

              {/* Banner "Ao autorizar o serviço" */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4 animate-pulse">
                <div className="h-2.5 w-40 rounded bg-slate-100" />
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="h-6 w-8 rounded-lg bg-blue-100/60 shrink-0" />
                      <div className="flex-1 space-y-1.5 pt-1">
                        <div className="h-2.5 w-full rounded bg-slate-100" />
                        <div className="h-2.5 w-2/3 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ── Coluna Direita — Cards de serviço ── */}
          <div className="w-full lg:w-2/3 flex flex-col gap-4">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="bg-white rounded-[2.5rem] p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 animate-pulse"
              >
                {/* Cabeçalho do prestador */}
                <div className="flex items-center justify-between px-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                    <div className="space-y-1.5">
                      <div className="h-2 w-14 rounded bg-slate-100" />
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded-full bg-slate-100" />
                </div>

                {/* Foto de capa com badge de status, igual ao card real */}
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100">
                  <div className="absolute top-4 left-4 bg-white/80 px-3 py-1.5 rounded-full">
                    <div className="h-2.5 w-24 rounded bg-slate-200" />
                  </div>
                </div>

                {/* Título + data + botões */}
                <div className="mt-5 px-2 space-y-5">
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-2.5 w-32 rounded bg-slate-100" />
                  </div>
                  <div className="flex gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
                    <div className="flex-1 h-14 rounded-2xl bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </main>
  )
}

// components/skeletons/EditarPerfilSkeleton.tsx

export default function EditarPerfilSkeleton() {
  return (
    <section className="pb-12 sm:pb-16" aria-hidden="true">
      <div className="flex flex-col gap-6 sm:gap-8">

        {/* Header — espelha "Dados profissionais" / "Configurações do perfil" */}
        <header className="flex flex-col gap-1.5 animate-pulse">
          <div className="h-2.5 w-32 rounded bg-blue-100/60" />
          <div className="h-6 w-2/3 sm:w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">

          {/* ── Coluna Esquerda — FotoUpload ── */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-48 lg:col-span-4">
            <div className="bg-white rounded-[1.75rem] border border-slate-200 shadow-sm p-5 sm:p-6 animate-pulse">
              <div className="aspect-square w-full rounded-[1.5rem] bg-slate-100" />
              <div className="mt-4 h-3 w-2/3 mx-auto rounded bg-slate-100" />
            </div>
          </div>

          {/* ── Coluna Direita ── */}
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">

            {/* Conta conectada */}
            <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6 animate-pulse">
              <div className="min-w-0 space-y-1.5">
                <div className="h-2 w-24 rounded bg-slate-100" />
                <div className="h-3.5 w-40 rounded bg-slate-200" />
              </div>
              <div className="h-9 w-28 rounded-xl bg-slate-100 shrink-0" />
            </section>

            {/* Fotos por padrão */}
            <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 animate-pulse">
              <div className="space-y-1.5">
                <div className="h-2 w-16 rounded bg-slate-100" />
                <div className="h-3.5 w-32 rounded bg-slate-200" />
                <div className="h-2.5 w-full rounded bg-slate-100" />
                <div className="h-2.5 w-2/3 rounded bg-slate-100" />
              </div>
              <div className="h-10 w-full rounded-xl bg-slate-100" />
            </section>

            {/* O que você faz */}
            <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 animate-pulse">
              <div className="h-2 w-28 rounded bg-slate-100" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="h-14 rounded-2xl bg-slate-100" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-24 rounded-full bg-slate-100" />
                ))}
              </div>
            </section>

            {/* Dados pessoais */}
            <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 animate-pulse">
              <div className="h-2 w-24 rounded bg-slate-100" />
              <div className="space-y-3">
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="h-24 rounded-2xl bg-slate-100" />
              </div>
            </section>

            {/* Garantia */}
            <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 animate-pulse">
              <div className="h-2 w-20 rounded bg-slate-100" />
              <div className="h-14 rounded-2xl bg-slate-100" />
            </section>

            {/* Localização */}
            <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 animate-pulse">
              <div className="h-2 w-28 rounded bg-slate-100" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="h-14 rounded-2xl bg-slate-100" />
              </div>
              <div className="h-14 rounded-2xl bg-slate-100" />
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-8 w-28 rounded-full bg-slate-100" />
                ))}
              </div>
            </section>

            {/* Botão salvar */}
            <div className="flex flex-col gap-4 pt-2 animate-pulse">
              <div className="h-14 w-full rounded-2xl bg-slate-200" />
              <div className="h-3 w-40 mx-auto rounded bg-slate-100" />
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

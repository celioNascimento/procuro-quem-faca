// components/skeletons/EditarPerfilSkeleton.tsx
//
// Espelha a tela "Dados profissionais" (EditarPerfilTab): mesmo cabeçalho, mesmas colunas
// e as seções na mesma ordem, para a página não "pular" quando os dados chegam.

const cartao = 'flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 animate-pulse'

function CabecalhoDaSecao() {
  return (
    <div className="flex items-start gap-3">
      <div className="size-10 shrink-0 rounded-xl bg-blue-50" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  )
}

function CampoFantasma() {
  return (
    <div className="space-y-1.5">
      <div className="h-3.5 w-28 rounded bg-slate-200" />
      <div className="h-12 rounded-xl bg-slate-100" />
    </div>
  )
}

export default function EditarPerfilSkeleton() {
  return (
    <section className="pb-12 sm:pb-16" aria-busy="true" aria-label="Carregando edição do perfil">
      <div className="flex flex-col gap-6 sm:gap-8">
        <header className="flex animate-pulse flex-col gap-2">
          <div className="h-3 w-32 rounded bg-blue-100/60" />
          <div className="h-6 w-2/3 rounded bg-slate-200 sm:w-1/3" />
          <div className="h-3.5 w-3/4 rounded bg-slate-100 sm:w-1/2" />
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Coluna esquerda: foto e conta */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-48 lg:col-span-4">
            <div className={`${cartao} items-center gap-4`}>
              <div className="aspect-[4/3] w-full max-w-sm rounded-2xl bg-slate-100" />
              <div className="h-11 w-36 rounded-xl bg-slate-100" />
              <div className="h-3 w-2/3 rounded bg-slate-100" />
            </div>
            <div className={`${cartao} gap-3`}>
              <div className="h-3 w-28 rounded bg-slate-100" />
              <div className="h-4 w-44 rounded bg-slate-200" />
              <div className="h-11 rounded-xl bg-slate-100" />
            </div>
          </div>

          {/* Coluna direita: seções */}
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
            <section className={cartao}>
              <CabecalhoDaSecao />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><CampoFantasma /><CampoFantasma /></div>
              <div className="flex flex-wrap gap-2">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-9 w-24 rounded-full bg-slate-100" />)}
              </div>
            </section>

            <section className={cartao}>
              <CabecalhoDaSecao />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><CampoFantasma /><CampoFantasma /></div>
              <CampoFantasma />
              <div className="h-28 rounded-xl bg-slate-100" />
            </section>

            <section className={cartao}>
              <CabecalhoDaSecao />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <CampoFantasma /><CampoFantasma /><CampoFantasma /><CampoFantasma />
              </div>
            </section>

            <section className={cartao}>
              <CabecalhoDaSecao />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}
              </div>
            </section>

            <div className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="h-full rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

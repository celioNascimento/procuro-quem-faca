//components/skeletons/PerfilSkeleton.tsx

import Header from '@/components/Header'

export default function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <Header href="/prestadores" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pt-32">
        {/* AdCard Skeleton - Espelhando o banner arredondado vermelho/laranja */}
        <div className="mx-auto flex w-full max-w-3xl items-center justify-center animate-pulse">
          <div className="w-full h-[140px] md:h-[160px] rounded-[2.5rem] bg-slate-200/70" />
        </div>

        <div className="mt-5 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-14">
          
          {/* Coluna Esquerda - Hero (Sticky) */}
          <aside className="min-w-0 lg:sticky lg:top-28">
            <div className="flex flex-col gap-4 animate-pulse">
              
              {/* Card Hero (Avatar à esquerda, info à direita) */}
              <div className="w-full rounded-[2.5rem] border border-slate-50 bg-white p-5 sm:p-7 shadow-sm flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  {/* Avatar box */}
                  <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-[1.5rem] bg-slate-200 border-4 border-white shadow-sm" />
                  
                  {/* Textos: Nome, Slug, Localização */}
                  <div className="flex-1 flex flex-col gap-2.5">
                    <div className="flex flex-col gap-1.5">
                      <div className="h-5 w-full rounded-md bg-slate-200" />
                      <div className="h-5 w-2/3 rounded-md bg-slate-200" />
                    </div>
                    <div className="h-3 w-full rounded-md bg-slate-100 mt-1" />
                    <div className="h-3 w-2/3 rounded-md bg-slate-100" />
                  </div>
                </div>
                
                {/* Badge (Ex: Pedreiro) */}
                <div className="h-9 w-28 rounded-full bg-slate-100" />
              </div>

              {/* Botões de Ação (Denunciar / Compartilhar) */}
              <div className="flex gap-3">
                <div className="flex-1 h-[3.25rem] rounded-full border border-slate-100 bg-white shadow-sm" />
                <div className="flex-1 h-[3.25rem] rounded-full border border-slate-100 bg-white shadow-sm" />
              </div>

            </div>
          </aside>

          {/* Coluna Direita - Conteúdo */}
          <div className="flex min-w-0 flex-col gap-7 sm:gap-8 lg:gap-10">
            
            {/* Sobre o Profissional + Botão WhatsApp */}
            <div className="w-full rounded-[2.5rem] border border-slate-50 bg-white p-6 sm:p-8 shadow-sm flex justify-between items-end gap-4 animate-pulse">
              <div className="flex-1 flex flex-col gap-3">
                <div className="h-3 w-32 rounded-md bg-blue-100/50 mb-1" />
                <div className="h-4 w-full rounded-md bg-slate-100" />
                <div className="h-4 w-4/5 rounded-md bg-slate-100" />
              </div>
              {/* Círculo do botão WhatsApp */}
              <div className="h-14 w-14 shrink-0 rounded-full bg-blue-100/50" />
            </div>

            {/* Portfolio Grid Skeleton */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                 <div className="h-3 w-24 rounded-md bg-blue-100/50 animate-pulse" />
                 <div className="h-6 w-56 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/3] w-full rounded-[2rem] bg-white border border-slate-50 shadow-sm animate-pulse" />
                ))}
              </div>
            </section>

            {/* Avaliações Skeleton */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
                 <div className="h-6 w-40 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="flex flex-col gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="w-full h-40 rounded-[2.5rem] bg-white border border-slate-50 shadow-sm animate-pulse" />
                ))}
              </div>
            </section>
            
          </div>
        </div>
      </div>
    </main>
  )
}

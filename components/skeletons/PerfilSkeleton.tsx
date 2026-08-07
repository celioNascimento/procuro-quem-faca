//components/skeletons/PerfilSkeleton.tsx

import Header from '@/components/Header'

export default function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <Header href="/prestadores" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8 lg:pt-32">
        {/* AdCard Skeleton */}
        <div className="mx-auto flex w-full max-w-3xl items-center justify-center">
          <div className="w-full h-[90px] md:h-[120px] rounded-[1.5rem] bg-slate-200/50 animate-pulse" />
        </div>

        <div className="mt-5 grid items-start gap-6 lg:mt-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-14">
          
          {/* Coluna Esquerda - Hero (Sticky) */}
          <aside className="min-w-0 lg:sticky lg:top-28">
            <div className="flex flex-col gap-4 lg:gap-5">
              <div className="w-full rounded-[2.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col items-center gap-5 animate-pulse">
                {/* Avatar */}
                <div className="h-28 w-28 rounded-[2rem] bg-slate-200" />
                
                {/* Textos */}
                <div className="flex w-full flex-col items-center gap-3">
                  <div className="h-6 w-3/4 rounded-lg bg-slate-200" />
                  <div className="h-4 w-1/2 rounded-lg bg-slate-100" />
                </div>
                
                {/* Badges Info */}
                <div className="flex w-full justify-center gap-2 mt-2">
                  <div className="h-8 w-16 rounded-full bg-slate-100" />
                  <div className="h-8 w-24 rounded-full bg-slate-100" />
                </div>
                
                {/* Botão de Ação */}
                <div className="w-full h-14 rounded-[1.25rem] bg-slate-100 mt-2" />
              </div>
            </div>
          </aside>

          {/* Coluna Direita - Conteúdo */}
          <div className="flex min-w-0 flex-col gap-7 sm:gap-8 lg:gap-10">
            
            {/* Sobre + CTA */}
            <div className="flex flex-col gap-4">
              {/* Card Sobre */}
              <div className="w-full rounded-[2.5rem] border border-slate-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-4 animate-pulse">
                <div className="h-5 w-1/3 rounded-lg bg-slate-200" />
                <div className="flex flex-col gap-3 mt-2">
                  <div className="h-4 w-full rounded-md bg-slate-100" />
                  <div className="h-4 w-full rounded-md bg-slate-100" />
                  <div className="h-4 w-4/5 rounded-md bg-slate-100" />
                </div>
              </div>
              
              {/* Card CTA */}
              <div className="w-full h-24 rounded-[2rem] bg-slate-200/60 animate-pulse" />
            </div>

            {/* Portfolio Grid Skeleton */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                 <div className="h-3 w-20 rounded-md bg-blue-100 animate-pulse" />
                 <div className="h-6 w-48 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="aspect-[4/3] w-full rounded-[2rem] bg-white border border-slate-100 shadow-sm animate-pulse" />
                ))}
              </div>
            </section>

            {/* Avaliações Skeleton */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
                 <div className="h-6 w-32 rounded-lg bg-slate-200 animate-pulse" />
              </div>
              <div className="flex flex-col gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="w-full h-40 rounded-[2rem] bg-white border border-slate-100 shadow-sm animate-pulse" />
                ))}
              </div>
            </section>
            
          </div>
        </div>
      </div>
    </main>
  )
}

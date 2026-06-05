import Header from '@/components/Header'

export default function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans">
      <Header href="/prestadores" />
      
      <div className="max-w-xl lg:max-w-6xl mx-auto pt-24 md:pt-32 pb-12 px-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4">
          
          {/* Esquerda - Identidade (Skeleton) */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start gap-4">
            <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-[2rem] bg-slate-100" />
            <div className="h-7 bg-slate-100 rounded-lg w-2/3 lg:w-full" />
            <div className="h-4 bg-slate-50 rounded-lg w-1/3 lg:w-2/3" />
            
            <div className="w-full mt-2 lg:mt-4 pt-4 border-t border-slate-100 flex gap-3 justify-center lg:justify-start">
              <div className="h-8 w-24 bg-slate-50 rounded-full" />
              <div className="h-8 w-24 bg-slate-50 rounded-full" />
            </div>
          </div>

          {/* Direita - Conteúdo (Skeleton) */}
          <div className="lg:col-span-8 flex flex-col gap-6 lg:gap-8">
            <div className="space-y-4">
              <div className="h-40 bg-slate-50 rounded-[2rem]" />
              <div className="h-16 bg-slate-50 rounded-[1.5rem]" />
            </div>

            <div className="space-y-3">
              <div className="h-3 bg-slate-100 rounded-lg w-32" />
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="aspect-square bg-slate-50 rounded-2xl" />
                ))}
              </div>
            </div>
            
            <div className="h-48 bg-slate-50 rounded-[2rem]" />
          </div>

        </div>
      </div>
    </main>
  )
}
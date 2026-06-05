import Header from '@/components/Header'

export default function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans">
      <Header href="/prestadores" />
      <div className="max-w-xl mx-auto pt-24 md:pt-32 pb-12 px-6 animate-pulse">
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="w-28 h-28 rounded-[2rem] bg-slate-100" />
          <div className="h-7 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-50 rounded-lg w-1/3" />
        </div>
        <div className="space-y-4">
          <div className="h-28 bg-slate-50 rounded-[2rem]" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-slate-50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
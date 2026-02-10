'use client'
export default function PortfolioTab() {
  return (
    <div className="grid grid-cols-3 gap-1 animate-in slide-in-from-bottom-2 duration-500">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="aspect-square bg-slate-100 rounded-sm overflow-hidden hover:opacity-80 cursor-pointer transition-opacity">
          <img src={`https://picsum.photos/400/400?random=${i}`} className="w-full h-full object-cover" alt="Trabalho" />
        </div>
      ))}
      <button className="aspect-square border-2 border-dashed border-slate-200 rounded-sm flex flex-col items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-300 transition-colors">
        <span className="text-2xl">+</span>
        <span className="text-[8px] font-black uppercase">Novo</span>
      </button>
    </div>
  )
}
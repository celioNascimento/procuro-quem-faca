'use client'

export default function CadastroCard({ children, title, progresso, isReivindicando, onExcluir }) {
  return (
    /* Card agora cresce livremente até o limite do container pai */
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10 pl-2 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
            {title}
          </h1>
          <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest mt-2 block">
            {progresso}% concluído
          </span>
        </div>
        
        {isReivindicando && (
          <button 
            type="button"
            onClick={onExcluir}
            className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline mb-1 italic"
          >
            Excluir este perfil
          </button>
        )}
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  )
}

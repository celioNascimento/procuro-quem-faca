export default function ModalDenuncias({ denunciasSelecionadas, onClose, onResolver, onBloquear, formatarData }) {
  if (!denunciasSelecionadas) return null

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="p-6 sm:p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 uppercase tracking-tight">Central de Denúncias</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Análise de Segurança</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-red-500 p-2 text-2xl">✕</button>
        </div>
        <div className="p-6 sm:p-8 max-h-[70vh] overflow-y-auto space-y-4 scrollbar-hide">
          {denunciasSelecionadas.lista.map((d, i) => (
            <div key={i} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-20"></div>
              <p className="text-slate-700 text-[13px] font-medium leading-relaxed">"{d.motivo}"</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 flex justify-between">
                <span>📅 {formatarData(d.created_at)}</span>
                <span className="text-red-400">ID: #{d.id}</span>
              </p>
            </div>
          ))}
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => onResolver(denunciasSelecionadas.id)}
              className="w-full py-5 bg-green-500 text-white rounded-2xl font-bold text-[11px] uppercase hover:bg-green-600 transition-all shadow-lg shadow-green-100 active:scale-95"
            >
              ✅ Marcar como Verificado (Limpar)
            </button>
            <button 
              onClick={() => {
                onBloquear(denunciasSelecionadas.id, 'bloqueado');
                onClose();
              }}
              className="w-full py-4 text-red-500 font-bold text-[11px] uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-colors"
            >
              Bloquear Prestador Agora
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
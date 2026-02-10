import { CATEGORIAS_OFICIAIS } from '@/lib/categorias'

export default function ModeracaoCard({ 
  p, 
  editando, 
  setEditando, 
  alterarStatus, 
  salvarEdicao, 
  cidades, 
  setDenunciasSelecionadas 
}) {
  const temDenunciaAberta = p.totalDenuncias > 0

  // Função para pegar as iniciais do nome
  const getIniciais = (nome) => {
    if (!nome) return '?';
    const partes = nome.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0][0].toUpperCase();
  };
  
  let statusEstilo = {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    label: p.status?.toUpperCase() || 'N/A'
  }

  if (p.status === 'bloqueado') {
    statusEstilo = { bg: 'bg-red-600', text: 'text-white', label: 'BLOQUEADO' }
  } else if (temDenunciaAberta) {
    statusEstilo = { bg: 'bg-amber-400', text: 'text-slate-900', label: '⚠️ VERIFICAR' }
  } else if (p.status === 'ativo') {
    statusEstilo = { bg: 'bg-green-500', text: 'text-white', label: 'ATIVO' }
  }

  return (
    <div className={`bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border-2 transition-all ${
      p.status === 'bloqueado' ? 'border-red-100 bg-red-50/10' : 
      temDenunciaAberta ? 'border-amber-200 bg-amber-50/10' : 'border-white'
    }`}>
      <div className="flex flex-col lg:flex-row items-center lg:items-center gap-5">
        
        <div className="flex lg:block items-center justify-between w-full lg:w-auto">
          {/* Avatar Redondo com Iniciais como Fallback */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-inner bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            {p.foto_perfil ? (
              <img 
                src={p.foto_perfil} 
                className="w-full h-full object-cover" 
                alt={p.nome} 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<span class="text-lg sm:text-xl font-black text-slate-400 tracking-tighter">${getIniciais(p.nome)}</span>`;
                }}
              />
            ) : (
              <span className="text-lg sm:text-xl font-black text-slate-400 tracking-tighter">
                {getIniciais(p.nome)}
              </span>
            )}
          </div>

          <div className="lg:hidden flex flex-col items-end gap-2">
            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${statusEstilo.bg} ${statusEstilo.text}`}>
              {statusEstilo.label}
            </span>
          </div>
        </div>

        <div className="flex-1 w-full text-center lg:text-left">
          <div className="hidden lg:flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight leading-none">{p.nome || 'SEM NOME'}</h3>
            <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${statusEstilo.bg} ${statusEstilo.text}`}>
              {statusEstilo.label}
            </span>
          </div>

          <div className="lg:hidden mb-4">
             <h3 className="text-lg font-bold text-slate-900 uppercase leading-none">{p.nome || 'SEM NOME'}</h3>
          </div>

          {editando === p.id ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-blue-100">
              <select id={`cat-${p.id}`} defaultValue={p.categoria} className="sm:col-span-2 p-3 rounded-xl text-[11px] font-semibold text-slate-700 border bg-white">
                {CATEGORIAS_OFICIAIS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input id={`b-${p.id}`} defaultValue={p.bairro} placeholder="Bairro" className="p-3 rounded-xl text-[11px] font-semibold text-slate-700 border bg-white" />
              <select id={`c-${p.id}`} defaultValue={p.cidade_id} className="p-3 rounded-xl text-[11px] font-semibold text-slate-700 border bg-white">
                <option value="">Cidade</option>
                {cidades.map(cid => <option key={cid.id} value={cid.id}>{cid.nome}</option>)}
              </select>
              <div className="sm:col-span-2 flex gap-2 pt-2">
                <button onClick={() => setEditando(null)} className="flex-1 bg-slate-200 text-slate-600 p-3 rounded-xl text-[11px] font-bold uppercase">Cancelar</button>
                <button onClick={() => salvarEdicao(p.id)} className="flex-1 bg-blue-600 text-white p-3 rounded-xl text-[11px] font-bold uppercase">Salvar</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-4 text-[10px] font-semibold uppercase text-slate-400">
              <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">📂 {p.categoria}</span>
              <span className="text-slate-500 bg-slate-50 px-2 py-1 rounded-md">📍 {p.cidades?.nome || 'n/a'}</span>
              <span className="text-slate-400 bg-slate-50 px-2 py-1 rounded-md">🏠 {p.bairro}</span>
            </div>
          )}
        </div>

        <div className="flex w-full lg:w-auto gap-2 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-between sm:justify-end">
          <div className="flex gap-2">
            <button onClick={() => setEditando(p.id === editando ? null : p.id)} className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors text-slate-600">🖋️</button>
            <button 
              onClick={() => alterarStatus(p.id, p.status === 'bloqueado' ? 'pendente' : 'bloqueado')} 
              className={`p-4 rounded-2xl transition-all ${p.status === 'bloqueado' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-red-600'}`}
            >
              {p.status === 'bloqueado' ? '🔓' : '🔒'}
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            {temDenunciaAberta && (
              <button 
                onClick={() => setDenunciasSelecionadas({ lista: p.listaDenuncias, id: p.id })}
                className="hidden lg:block bg-red-600 text-white px-4 py-4 rounded-2xl font-bold text-[10px] uppercase shadow-lg shadow-red-100 hover:scale-105 transition-transform"
              >
                🚨 Ver Denúncias
              </button>
            )}
            <button 
              onClick={() => alterarStatus(p.id, p.status === 'ativo' ? 'pendente' : 'ativo')} 
              className={`px-6 py-4 rounded-2xl font-bold text-[10px] uppercase shadow-xl transition-all active:scale-95 ${p.status === 'ativo' ? 'bg-slate-200 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}
            >
              {p.status === 'ativo' ? 'Suspender' : 'Aprovar'}
            </button>
          </div>
        </div>

        {temDenunciaAberta && (
          <button 
            onClick={() => setDenunciasSelecionadas({ lista: p.listaDenuncias, id: p.id })}
            className="lg:hidden w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-wide border border-red-100"
          >
            Analisar Denúncias em Aberto
          </button>
        )}
      </div>
    </div>
  )
}
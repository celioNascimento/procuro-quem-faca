// app/(admin)/admin/logs/page.tsx

'use client'

import { useAdminLogs } from '@/hooks/useAdminLogs'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

export default function AdminLogs() {
  const {
    loading, refreshing, logsFiltrados, dadosGrafico,
    busca, setBusca, dataInicio, setDataInicio, tipoFiltro, setTipoFiltro,
    periodoGrafico, setPeriodoGrafico,
    carregarLogs, exportarCSV, resetarFiltros,
  } = useAdminLogs()

  const renderDetalhes = (log: any) => {
    const d = log.detalhes || {}
    switch (log.acao) {
      case 'BUSCA_SEM_SUCESSO': return <span className="text-red-500 font-bold tracking-tight">🔍 &quot;{d.termo}&quot;</span>
      case 'CLIQUE_PERFIL': return <span className="text-indigo-500 font-bold tracking-tight">👤 {d.nome}</span>
      case 'DENUNCIA_PERFIL': return <span className="text-amber-600 font-bold tracking-tight">🚨 {d.motivo?.substring(0, 30)}</span>
      default: return <span className="text-slate-400 italic font-medium text-[10px]">Evento de sistema</span>
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 font-sans text-slate-800">

      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Auditoria<span className="text-indigo-600 not-italic">.OS</span></h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">Inteligência de Tráfego e Logs</p>
        </div>
        <button
          onClick={carregarLogs}
          disabled={refreshing}
          className={`w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-90 ${refreshing ? 'animate-pulse opacity-50' : 'hover:bg-indigo-600'}`}
        >
          <span className={`${refreshing ? 'animate-spin' : ''}`}>⚡</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic leading-none">Busca por Email / Termo</label>
          <input type="text" placeholder="Filtrar registros..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 focus:border-indigo-200 text-xs font-bold transition-all" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic leading-none">Data do Log</label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 focus:border-indigo-200 text-xs font-bold text-slate-600" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic leading-none">Tipo de Evento</label>
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="w-full p-4 rounded-2xl bg-white border border-slate-100 shadow-sm outline-none focus:ring-4 ring-indigo-50 focus:border-indigo-200 text-xs font-bold text-slate-600">
            <option value="TODOS">Todos os Eventos</option>
            <option value="ACESSO_SITE">Acessos ao Site</option>
            <option value="BUSCA_SEM_SUCESSO">Buscas Vazias</option>
            <option value="DENUNCIA_PERFIL">Denúncias</option>
            <option value="CLIQUE_PERFIL">Cliques em Perfis</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm mb-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-slate-800 uppercase italic text-sm tracking-tight">Atividade Reativa</h3>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {['DIA', 'MES'].map(p => (
              <button key={p} onClick={() => setPeriodoGrafico(p as 'DIA' | 'MES')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all ${periodoGrafico === p ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{p}</button>
            ))}
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="total" radius={[10, 10, 10, 10]} barSize={30}>
                {dadosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.buscas > 0 ? '#f59e0b' : '#4f46e5'} fillOpacity={entry.buscas > 0 ? 0.9 : 0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden mb-20">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-slate-800 uppercase italic text-sm tracking-tight leading-none">Timeline ({logsFiltrados.length})</h3>
            <button
              onClick={exportarCSV}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm"
            >
              📥 Exportar CSV
            </button>
          </div>
          {(busca || dataInicio || tipoFiltro !== 'TODOS') && (
            <button onClick={resetarFiltros} className="text-[9px] font-black text-indigo-600 uppercase border-b-2 border-indigo-600">Resetar Filtros</button>
          )}
        </div>

        <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto scrollbar-hide">
          {logsFiltrados.map((log) => (
            <div key={log.id} className="p-5 hover:bg-indigo-50/30 transition-colors flex items-center gap-4 group">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-xs border shadow-sm transition-transform group-hover:scale-110 ${
                log.acao.includes('BUSCA') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                log.acao.includes('DENUNCIA') ? 'bg-red-50 text-red-600 border-red-100' :
                'bg-indigo-50 text-indigo-600 border-indigo-100'
              }`}>
                {log.acao.includes('BUSCA') ? '🔍' : log.acao.includes('DENUNCIA') ? '🚨' : '📄'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{log.acao.replace(/_/g, ' ')}</p>
                  <span className="text-[9px] font-bold text-slate-300 italic truncate max-w-[150px]">{log.usuario_email || 'Visitante Anonimo'}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-600 leading-none">{renderDetalhes(log)}</div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-black text-slate-900 block tracking-tighter italic">{new Date(log.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[8px] font-bold text-slate-300 uppercase block tracking-widest">{new Date(log.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
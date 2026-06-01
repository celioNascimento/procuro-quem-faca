'use client'
import { useGeografia } from './hooks/useGeografia'
import { FormEstado } from './components/FormEstado'
import { FormRegiao } from './components/FormRegiao'
import { FormCidade } from './components/FormCidade'
import { TabelaCidades } from './components/TabelaCidades'

export default function SuperGestaoGeografia() {
  const { estados, regioes, cidades, loading, error, addEstado, addRegiao, addCidade, atualizarRegiaoCidade } = useGeografia()

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm shadow-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg">
                <span className="text-white font-black text-xs italic">G</span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase italic">
                GeoMestra<span className="text-indigo-600 not-italic">.OS</span>
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Sincronização em Tempo Real
            </p>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Municípios Ativos</p>
            <p className="text-sm font-black text-slate-700 leading-none">{cidades.length}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6 space-y-8 mt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-red-700 text-sm font-semibold">
            ⚠️ Erro ao carregar dados: {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-8 h-64 animate-pulse">
                <div className="h-2 bg-slate-100 rounded mb-6 w-1/3" />
                <div className="space-y-4">
                  <div className="h-12 bg-slate-50 rounded-xl" />
                  <div className="h-12 bg-slate-50 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-2xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <FormEstado onSubmit={addEstado} />
            <FormRegiao estados={estados} onSubmit={addRegiao} />
            <FormCidade estados={estados} regioes={regioes} onSubmit={addCidade} />
          </div>
        )}

        {!loading && (
          <TabelaCidades cidades={cidades} regioes={regioes} onAtualizarRegiao={atualizarRegiaoCidade} total={cidades.length} />
        )}
      </main>
    </div>
  )
}
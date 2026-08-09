// app/(admin)/admin/moderacao/page.tsx

'use client'
import { useState } from 'react'
import { AlertCircle, ShieldOff, CheckCircle2, Archive, Loader2 } from 'lucide-react'
import { useModeracao } from '@/hooks/useModeracao'

const FILTROS = [
  { valor: 'aberta', label: 'Abertas' },
  { valor: 'resolvida', label: 'Resolvidas' },
  { valor: 'arquivada', label: 'Arquivadas' },
  { valor: 'todas', label: 'Todas' },
] as const

export default function ModeracaoPage() {
  const { denuncias, loading, filtro, setFiltro, processando, arquivar, resolverSemBloqueio, resolverComBloqueio } = useModeracao()
  const [motivoBloqueio, setMotivoBloqueio] = useState<Record<string, string>>({})

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
          Moderação<span className="text-red-600 not-italic">.</span>
        </h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Denúncias de prestadores</p>
      </header>

      <div className="flex gap-2 mb-6">
        {FILTROS.map(f => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filtro === f.valor ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : denuncias.length === 0 ? (
        <div className="py-20 text-center text-slate-300">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-[11px] font-black uppercase tracking-widest">Nenhuma denúncia nesta categoria</p>
        </div>
      ) : (
        <div className="space-y-4">
          {denuncias.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {d.prestadores?.foto_perfil ? (
                    <img src={d.prestadores.foto_perfil} className="w-10 h-10 rounded-xl object-cover" alt={d.prestadores.nome} />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-100" />
                  )}
                  <div>
                    <p className="font-black text-slate-800 text-sm">{d.prestadores?.nome || 'Prestador removido'}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      {d.prestadores?.bloqueado && <span className="text-red-500 ml-2">• Já bloqueado</span>}
                    </p>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                  d.status === 'aberta' ? 'bg-amber-50 text-amber-600' :
                  d.status === 'resolvida' ? 'bg-green-50 text-green-600' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {d.status}
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-4">{d.motivo}</p>

              {d.status === 'aberta' && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => resolverSemBloqueio(d.id)}
                    disabled={processando === d.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 size={12} /> Resolver
                  </button>
                  <button
                    onClick={() => arquivar(d.id)}
                    disabled={processando === d.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    <Archive size={12} /> Arquivar
                  </button>

                  {!d.prestadores?.bloqueado && (
                    <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                      <input
                        type="text"
                        placeholder="Motivo do bloqueio..."
                        value={motivoBloqueio[d.id] || ''}
                        onChange={e => setMotivoBloqueio(prev => ({ ...prev, [d.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-red-300"
                      />
                      <button
                        onClick={() => resolverComBloqueio(d.id, d.prestador_id, motivoBloqueio[d.id] || d.motivo)}
                        disabled={processando === d.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {processando === d.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />} Bloquear
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
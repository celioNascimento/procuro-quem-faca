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
  const { denuncias, loading, filtro, setFiltro, processando, arquivar, resolverSemBloqueio, resolverComBloqueio, desbloquear } = useModeracao()
  const [motivoBloqueio, setMotivoBloqueio] = useState<Record<string, string>>({})

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Central de segurança</p>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 sm:text-3xl">
            Moderação<span className="not-italic text-red-600">.</span>
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Denúncias de prestadores</p>
        </div>
        <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 sm:inline-flex">
          {denuncias.length} {denuncias.length === 1 ? 'registro' : 'registros'}
        </span>
      </header>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
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
            <div key={d.id} className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {d.prestadores?.foto_perfil ? (
                    <img src={d.prestadores.foto_perfil} className="h-12 w-12 shrink-0 rounded-xl object-contain bg-slate-50 p-1 sm:h-14 sm:w-14" alt={d.prestadores.nome} />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 sm:h-14 sm:w-14" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{d.prestadores?.nome || 'Prestador removido'}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      {d.prestadores?.bloqueado && <span className="ml-2 text-red-500">• Já bloqueado</span>}
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

              {(d.status === 'aberta' || d.prestadores?.bloqueado) && (
                <div className="flex min-w-0 flex-col items-stretch gap-2 border-t border-slate-50 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
                  {d.status === 'aberta' && (
                    <>
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
                    </>
                  )}

                  {d.prestadores?.bloqueado && d.prestador_id ? (
                    <button
                      onClick={() => desbloquear(d.id, d.prestador_id)}
                      disabled={processando === d.id}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black uppercase text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 sm:w-auto"
                    >
                      {processando === d.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />} Desbloquear perfil
                    </button>
                  ) : d.status === 'aberta' ? (
                    <div className="flex min-w-0 w-full flex-col items-stretch gap-2 sm:flex-1 sm:flex-row sm:items-center">
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
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-[10px] font-black uppercase whitespace-nowrap text-white transition-all hover:bg-red-700 disabled:opacity-50 sm:w-auto"
                      >
                        {processando === d.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />} Bloquear
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

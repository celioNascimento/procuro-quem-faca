// app/(admin)/admin/moderacao/page.tsx — versão final
'use client'
import { AlertCircle } from 'lucide-react'
import { useModeracao } from '@/hooks/useModeracao'
import { DenunciaCard } from '@/components/admin/moderacao/DenunciaCard'

const FILTROS = [
  { valor: 'aberta', label: 'Abertas' },
  { valor: 'resolvida', label: 'Resolvidas' },
  { valor: 'arquivada', label: 'Arquivadas' },
  { valor: 'todas', label: 'Todas' },
] as const

export default function ModeracaoPage() {
  const {
    denuncias, loading, filtro, setFiltro,
    processando, arquivar, resolverSemBloqueio, resolverComBloqueio, desbloquear,
    motivoBloqueio, atualizarMotivo,
  } = useModeracao()

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
            <DenunciaCard
              key={d.id}
              denuncia={d}
              processando={processando}
              motivoBloqueio={motivoBloqueio[d.id] || ''}
              onAtualizarMotivo={valor => atualizarMotivo(d.id, valor)}
              onArquivar={() => arquivar(d.id)}
              onResolverSemBloqueio={() => resolverSemBloqueio(d.id)}
              onResolverComBloqueio={() => resolverComBloqueio(d.id, d.prestador_id, motivoBloqueio[d.id] || d.motivo)}
              onDesbloquear={() => desbloquear(d.id, d.prestador_id)}
            />
          ))}
        </div>
      )}
    </main>
  )
}

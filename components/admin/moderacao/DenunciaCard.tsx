// components/admin/moderacao/DenunciaCard.tsx
import { CheckCircle2, Archive, ShieldOff, Loader2 } from 'lucide-react'
import type { DenunciaComPrestador } from '@/lib/services/denuncia.service'

interface DenunciaCardProps {
  denuncia: DenunciaComPrestador
  processando: string | null
  motivoBloqueio: string
  onAtualizarMotivo: (valor: string) => void
  onArquivar: () => void
  onResolverSemBloqueio: () => void
  onResolverComBloqueio: () => void
  onDesbloquear: () => void
}

export function DenunciaCard({
  denuncia: d,
  processando,
  motivoBloqueio,
  onAtualizarMotivo,
  onArquivar,
  onResolverSemBloqueio,
  onResolverComBloqueio,
  onDesbloquear,
}: DenunciaCardProps) {
  const ocupado = processando === d.id

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {d.prestadores?.foto_perfil ? (
            <img
              src={d.prestadores.foto_perfil}
              className="h-12 w-12 shrink-0 rounded-xl object-contain bg-slate-50 p-1 sm:h-14 sm:w-14"
              alt={d.prestadores.nome}
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-xl bg-slate-100 sm:h-14 sm:w-14" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-800">
              {d.prestadores?.nome || 'Prestador removido'}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">
              {new Date(d.created_at).toLocaleDateString('pt-BR')}
              {d.prestadores?.bloqueado && (
                <span className="ml-2 text-red-500">• Já bloqueado</span>
              )}
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
                onClick={onResolverSemBloqueio}
                disabled={ocupado}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-green-50 text-green-600 hover:bg-green-100 transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={12} /> Resolver
              </button>
              <button
                onClick={onArquivar}
                disabled={ocupado}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <Archive size={12} /> Arquivar
              </button>
            </>
          )}

          {d.prestadores?.bloqueado && d.prestador_id ? (
            <button
              onClick={onDesbloquear}
              disabled={ocupado}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[10px] font-black uppercase text-red-600 transition-all hover:bg-red-100 disabled:opacity-50 sm:w-auto"
            >
              {ocupado ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
              Desbloquear perfil
            </button>
          ) : d.status === 'aberta' ? (
            <div className="flex min-w-0 w-full flex-col items-stretch gap-2 sm:flex-1 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Motivo do bloqueio..."
                value={motivoBloqueio}
                onChange={e => onAtualizarMotivo(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-red-300"
              />
              <button
                onClick={onResolverComBloqueio}
                disabled={ocupado}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-[10px] font-black uppercase whitespace-nowrap text-white transition-all hover:bg-red-700 disabled:opacity-50 sm:w-auto"
              >
                {ocupado ? <Loader2 size={12} className="animate-spin" /> : <ShieldOff size={12} />}
                Bloquear
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

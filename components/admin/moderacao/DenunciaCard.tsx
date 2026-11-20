// components/admin/moderacao/DenunciaCard.tsx
import { CheckCircle2, Archive, ShieldOff, Loader2 } from 'lucide-react'
import type { DenunciaComPrestador } from '@/lib/services/denuncia.service'
import { Badge, Button, Input } from '@/components/admin/ui'

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

const STATUS = {
  aberta: { rotulo: 'Aberta', tom: 'alerta' },
  resolvida: { rotulo: 'Resolvida', tom: 'sucesso' },
  arquivada: { rotulo: 'Arquivada', tom: 'neutro' },
} as const

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
  const status = STATUS[d.status as keyof typeof STATUS] ?? { rotulo: d.status, tom: 'neutro' as const }

  return (
    <article className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {d.prestadores?.foto_perfil ? (
            <img
              src={d.prestadores.foto_perfil}
              className="h-12 w-12 shrink-0 rounded-lg bg-slate-50 object-contain p-1 sm:h-14 sm:w-14"
              alt={d.prestadores.nome}
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 sm:h-14 sm:w-14" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-pqf-ink">
              {d.prestadores?.nome || 'Prestador removido'}
            </p>
            <p className="text-xs text-pqf-muted">
              {new Date(d.created_at).toLocaleDateString('pt-BR')}
              {d.prestadores?.bloqueado && <span className="ml-2 font-semibold text-red-600">• Já bloqueado</span>}
            </p>
          </div>
        </div>
        <Badge tom={status.tom}>{status.rotulo}</Badge>
      </div>

      <p className="mb-4 text-sm text-slate-600">{d.motivo}</p>

      {(d.status === 'aberta' || d.prestadores?.bloqueado) && (
        <div className="flex min-w-0 flex-col items-stretch gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
          {d.status === 'aberta' && (
            <>
              <Button onClick={onResolverSemBloqueio} disabled={ocupado} icone={<CheckCircle2 size={14} />}>
                Resolver
              </Button>
              <Button onClick={onArquivar} disabled={ocupado} icone={<Archive size={14} />}>
                Arquivar
              </Button>
            </>
          )}

          {d.prestadores?.bloqueado && d.prestador_id ? (
            <Button onClick={onDesbloquear} disabled={ocupado} icone={ocupado ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}>
              Desbloquear perfil
            </Button>
          ) : d.status === 'aberta' ? (
            <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-1 sm:flex-row sm:items-center">
              <Input
                type="text"
                placeholder="Motivo do bloqueio..."
                aria-label="Motivo do bloqueio"
                value={motivoBloqueio}
                onChange={e => onAtualizarMotivo(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={onResolverComBloqueio}
                disabled={ocupado}
                icone={ocupado ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                className="justify-center whitespace-nowrap border-red-200 text-red-700 hover:border-red-600 hover:text-red-700"
              >
                Bloquear
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </article>
  )
}

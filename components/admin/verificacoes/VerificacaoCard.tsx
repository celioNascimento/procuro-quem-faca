// components/admin/verificacoes/VerificacaoCard.tsx
// Só exibe uma verificação de CNPJ e dispara as ações; não sabe nada de banco.
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { mascararCnpj } from '@/lib/cnpj/validacao'
import { podeAprovar, textoMotivoFila } from '@/lib/cnpj/motivoFila'
import type { VerificacaoCnpjAdmin } from '@/types/verificacoesAdmin'

interface VerificacaoCardProps {
  item: VerificacaoCnpjAdmin
  processando: string | null
  motivo: string
  onAtualizarMotivo: (valor: string) => void
  onAprovar: () => void
  onRejeitar: () => void
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">{rotulo}</dt>
      <dd className="break-words text-sm font-semibold text-slate-800">{valor || '—'}</dd>
    </div>
  )
}

export function VerificacaoCard({ item, processando, motivo, onAtualizarMotivo, onAprovar, onRejeitar }: VerificacaoCardProps) {
  const ocupado = processando === item.verificacao_id
  const aberta = item.status === 'pendente' || item.status === 'em_analise'
  const aprovada = item.status === 'aprovada'
  const aprovavel = podeAprovar(item.situacao)

  return (
    <article
      data-testid="verificacao-card"
      className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
    >
      <header className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black text-slate-800">{item.prestador_nome || 'Prestador sem nome'}</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            Enviado em {new Date(item.criado_em).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase ${
            aberta ? 'bg-amber-50 text-amber-600' : aprovada ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {aberta ? 'Aguardando' : aprovada ? 'Aprovada' : 'Rejeitada'}
        </span>
      </header>

      {aberta && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{textoMotivoFila(item.motivo)}</p>}

      <dl className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Linha rotulo="CNPJ" valor={item.cnpj ? mascararCnpj(item.cnpj) : null} />
        <Linha rotulo="Situação na Receita" valor={item.situacao} />
        <Linha rotulo="Razão social" valor={item.razao_social} />
        <Linha rotulo="Nome fantasia" valor={item.nome_fantasia} />
        <Linha rotulo="MEI" valor={item.mei === null ? null : item.mei ? 'Sim' : 'Não'} />
        <Linha
          rotulo="Consultado em"
          valor={item.consultado_em ? `${new Date(item.consultado_em).toLocaleDateString('pt-BR')} (${item.fonte ?? 'fonte desconhecida'})` : null}
        />
      </dl>

      {(aberta || aprovada) && (
        <div className="flex min-w-0 flex-col gap-2 border-t border-slate-50 pt-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400" htmlFor={`motivo-${item.verificacao_id}`}>
            Observação (opcional, fica registrada)
          </label>
          <input
            id={`motivo-${item.verificacao_id}`}
            value={motivo}
            onChange={e => onAtualizarMotivo(e.target.value)}
            maxLength={200}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
          {aberta && !aprovavel && (
            <p className="text-xs text-slate-500">Este CNPJ não está ativo na Receita, por isso só pode ser rejeitado.</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {aberta && (
              <button
                onClick={onAprovar}
                disabled={ocupado || !aprovavel}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-40"
              >
                {ocupado ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Aprovar
              </button>
            )}
            <button
              onClick={onRejeitar}
              disabled={ocupado}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-40"
            >
              {ocupado ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} {aprovada ? 'Revogar selo' : 'Rejeitar'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

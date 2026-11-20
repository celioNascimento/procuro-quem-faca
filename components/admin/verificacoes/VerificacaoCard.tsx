// components/admin/verificacoes/VerificacaoCard.tsx
// Só exibe uma verificação de CNPJ e dispara as ações; não sabe nada de banco.
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { mascararCnpj } from '@/lib/cnpj/validacao'
import { podeAprovar, textoMotivoFila } from '@/lib/cnpj/motivoFila'
import type { VerificacaoCnpjAdmin } from '@/types/verificacoesAdmin'
import { Badge, Button, Field, Input } from '@/components/admin/ui'

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
      <dt className="text-xs font-semibold text-pqf-muted">{rotulo}</dt>
      <dd className="break-words text-sm font-semibold text-pqf-ink">{valor || '—'}</dd>
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
      className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
    >
      <header className="mb-3 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-pqf-ink">{item.prestador_nome || 'Prestador sem nome'}</h2>
          <p className="text-xs text-pqf-muted">Enviado em {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p>
        </div>
        <Badge tom={aberta ? 'alerta' : aprovada ? 'sucesso' : 'neutro'}>
          {aberta ? 'Aguardando' : aprovada ? 'Aprovada' : 'Rejeitada'}
        </Badge>
      </header>

      {aberta && <p className="mb-4 rounded-lg bg-pqf-yellow/20 p-3 text-sm text-amber-900">{textoMotivoFila(item.motivo)}</p>}

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
        <div className="flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-3">
          <Field label="Observação (opcional, fica registrada)">
            <Input id={`motivo-${item.verificacao_id}`} value={motivo} onChange={e => onAtualizarMotivo(e.target.value)} maxLength={200} />
          </Field>
          {aberta && !aprovavel && (
            <p className="text-xs text-pqf-muted">Este CNPJ não está ativo na Receita, por isso só pode ser rejeitado.</p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            {aberta && (
              <Button
                variante="primario"
                onClick={onAprovar}
                disabled={ocupado || !aprovavel}
                icone={ocupado ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                className="justify-center"
              >
                Aprovar
              </Button>
            )}
            <Button
              onClick={onRejeitar}
              disabled={ocupado}
              icone={ocupado ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
              className="justify-center border-red-200 text-red-700 hover:border-red-600 hover:text-red-700"
            >
              {aprovada ? 'Revogar selo' : 'Rejeitar'}
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}

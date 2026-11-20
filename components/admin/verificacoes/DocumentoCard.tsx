// components/admin/verificacoes/DocumentoCard.tsx
// Um pedido de seguro ou CND para a equipe conferir. Só exibe e dispara ações.
import { CheckCircle2, FileText, Loader2, XCircle } from 'lucide-react'
import { mascararCnpj } from '@/lib/cnpj/validacao'
import { AVISO_SEM_CNPJ, CHECKLIST, checklistCompleto } from '@/lib/selos/checklistDocumentos'
import { ALERTA_PEDIDO_DIAS, diasEmEspera, PRAZO_PEDIDO_DIAS, ROTULO_DOCUMENTO, textoVencimento } from '@/lib/selos/documentos'
import type { DocumentoAdmin } from '@/lib/services/documentosVerificacao.service'
import type { CamposDecisao } from '@/hooks/useAdminDocumentos'
import { Badge, Button, Field, Input, Textarea } from '@/components/admin/ui'

interface Props {
  item: DocumentoAdmin
  processando: string | null
  campos: CamposDecisao
  onCampos: (parcial: Partial<CamposDecisao>) => void
  onAlternarItem: (item: string) => void
  onAbrir: () => void
  onAprovar: () => void
  onRejeitar: () => void
}

export function DocumentoCard({ item, processando, campos, onCampos, onAlternarItem, onAbrir, onAprovar, onRejeitar }: Props) {
  const ocupado = processando === item.verificacao_id
  const pedido = item.dados?.pedido as Record<string, string> | undefined
  const conferido = item.dados?.conferido as Record<string, string> | undefined
  const dados = pedido ?? conferido
  const aberto = !!pedido
  const espera = aberto ? diasEmEspera(pedido?.enviado_em) : 0
  const emAlerta = espera >= ALERTA_PEDIDO_DIAS
  const aprovavel = (item.tipo === 'seguro' ? !!campos.validoAte : !!campos.emissao) && checklistCompleto(item.tipo, campos.marcados)

  return (
    <article data-testid="documento-card" className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-pqf-ink">{item.prestador_nome || 'Prestador sem nome'}</h2>
          <p className="text-xs text-pqf-muted">{ROTULO_DOCUMENTO[item.tipo]} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p>
        </div>
        <Badge tom={aberto ? 'alerta' : item.status === 'aprovada' ? 'sucesso' : 'neutro'}>{aberto ? 'Aguardando' : item.status}</Badge>
      </header>

      {aberto && (
        <p
          data-testid="documento-espera"
          className={`mb-3 rounded-lg p-2 text-xs font-semibold ${emAlerta ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-pqf-muted'}`}
        >
          Aguardando há {espera} {espera === 1 ? 'dia' : 'dias'}.
          {emAlerta && ` Decida logo: com ${PRAZO_PEDIDO_DIAS} dias o arquivo é apagado automaticamente e o prestador precisa reenviar.`}
        </p>
      )}

      {aberto && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3" data-testid="documento-cnpj-perfil">
          <p className="text-xs font-semibold text-pqf-muted">CNPJ do perfil (compare com o titular do documento)</p>
          {item.cnpj ? (
            <p className="text-sm font-semibold text-pqf-ink">{mascararCnpj(item.cnpj)}{item.razao_social ? ` · ${item.razao_social}` : ''}</p>
          ) : (
            <p className="text-sm font-semibold text-red-700">{AVISO_SEM_CNPJ}</p>
          )}
        </div>
      )}

      {item.tipo === 'seguro' && dados && (
        <dl className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div><dt className="text-xs font-semibold text-pqf-muted">Seguradora</dt><dd className="text-sm font-semibold">{dados.seguradora}</dd></div>
          <div><dt className="text-xs font-semibold text-pqf-muted">Apólice</dt><dd className="text-sm font-semibold">{dados.numero_apolice}</dd></div>
          <div><dt className="text-xs font-semibold text-pqf-muted">Validade informada</dt><dd className="text-sm font-semibold">{dados.validade_informada}</dd></div>
        </dl>
      )}

      {!aberto && item.valido_ate && <p className="mb-3 text-sm font-semibold text-slate-700">{textoVencimento(item.valido_ate)}</p>}

      {aberto && (
        <div className="flex flex-col gap-3">
          <Button onClick={onAbrir} icone={<FileText size={16} aria-hidden="true" />} className="w-fit" data-testid="documento-abrir">Abrir comprovante</Button>

          {item.tipo === 'seguro' ? (
            <Field label="Validade que consta na apólice (para aprovar)">
              <Input type="date" value={campos.validoAte} onChange={(e) => onCampos({ validoAte: e.target.value })} data-testid="documento-validade" />
            </Field>
          ) : (
            <Field label="Data de emissão da certidão (vale 180 dias; para aprovar)">
              <Input type="date" value={campos.emissao} onChange={(e) => onCampos({ emissao: e.target.value })} data-testid="documento-emissao" />
            </Field>
          )}

          <fieldset className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3" data-testid="documento-checklist">
            <legend className="px-1 text-xs font-semibold text-pqf-muted">Conferência (marque tudo para aprovar)</legend>
            {CHECKLIST[item.tipo].map((i) => (
              <label key={i.id} className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="mt-1 h-4 w-4" checked={campos.marcados.includes(i.id)} onChange={() => onAlternarItem(i.id)} data-testid={`check-${i.id}`} />
                {i.texto}
              </label>
            ))}
          </fieldset>

          <Field label="Motivo (obrigatório só para rejeitar)">
            <Textarea rows={2} value={campos.motivo} onChange={(e) => onCampos({ motivo: e.target.value })} data-testid="documento-motivo" />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button variante="primario" disabled={ocupado || !aprovavel} onClick={onAprovar} data-testid="documento-aprovar"
              icone={ocupado ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}>
              Aprovar
            </Button>
            <Button disabled={ocupado || !campos.motivo.trim()} onClick={onRejeitar} data-testid="documento-rejeitar"
              icone={<XCircle size={16} />} className="border-red-200 text-red-700 hover:border-red-600 hover:text-red-700">
              Rejeitar
            </Button>
          </div>
          <p className="text-xs text-pqf-muted">Ao decidir, o arquivo é apagado: guardamos só o resumo e a validade.</p>
        </div>
      )}
    </article>
  )
}

// components/admin/verificacoes/DocumentoCard.tsx
// Um pedido de seguro ou CND para a equipe conferir. Só exibe e dispara ações.
import { CheckCircle2, FileText, Loader2, XCircle } from 'lucide-react'
import { ROTULO_DOCUMENTO, textoVencimento } from '@/lib/selos/documentos'
import type { DocumentoAdmin } from '@/lib/services/documentosVerificacao.service'
import type { CamposDecisao } from '@/hooks/useAdminDocumentos'

interface Props {
  item: DocumentoAdmin
  processando: string | null
  campos: CamposDecisao
  onCampos: (parcial: Partial<CamposDecisao>) => void
  onAbrir: () => void
  onAprovar: () => void
  onRejeitar: () => void
}

const CAMPO = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100'

export function DocumentoCard({ item, processando, campos, onCampos, onAbrir, onAprovar, onRejeitar }: Props) {
  const ocupado = processando === item.verificacao_id
  const pedido = item.dados?.pedido as Record<string, string> | undefined
  const conferido = item.dados?.conferido as Record<string, string> | undefined
  const dados = pedido ?? conferido
  const aberto = !!pedido
  const aprovavel = item.tipo === 'seguro' ? !!campos.validoAte : !!campos.emissao

  return (
    <article data-testid="documento-card" className="w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black text-slate-800">{item.prestador_nome || 'Prestador sem nome'}</h2>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">{ROTULO_DOCUMENTO[item.tipo]} · {new Date(item.criado_em).toLocaleDateString('pt-BR')}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">{aberto ? 'Aguardando' : item.status}</span>
      </header>

      {item.tipo === 'seguro' && dados && (
        <dl className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seguradora</dt><dd className="text-sm font-semibold">{dados.seguradora}</dd></div>
          <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Apólice</dt><dd className="text-sm font-semibold">{dados.numero_apolice}</dd></div>
          <div><dt className="text-[10px] font-black uppercase tracking-widest text-slate-400">Validade informada</dt><dd className="text-sm font-semibold">{dados.validade_informada}</dd></div>
        </dl>
      )}

      {!aberto && item.valido_ate && <p className="mb-3 text-sm font-semibold text-slate-700">{textoVencimento(item.valido_ate)}</p>}

      {aberto && (
        <div className="flex flex-col gap-3">
          <button type="button" onClick={onAbrir} className="flex min-h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50" data-testid="documento-abrir">
            <FileText size={16} aria-hidden="true" /> Abrir comprovante
          </button>

          {item.tipo === 'seguro' ? (
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              Validade que consta na apólice (para aprovar)
              <input type="date" className={CAMPO} value={campos.validoAte} onChange={(e) => onCampos({ validoAte: e.target.value })} data-testid="documento-validade" />
            </label>
          ) : (
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
              Data de emissão da certidão (vale 180 dias; para aprovar)
              <input type="date" className={CAMPO} value={campos.emissao} onChange={(e) => onCampos({ emissao: e.target.value })} data-testid="documento-emissao" />
            </label>
          )}

          <label className="flex flex-col gap-1 text-xs font-bold text-slate-600">
            Motivo (obrigatório só para rejeitar)
            <textarea rows={2} className={CAMPO} value={campos.motivo} onChange={(e) => onCampos({ motivo: e.target.value })} data-testid="documento-motivo" />
          </label>

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={ocupado || !aprovavel} onClick={onAprovar} data-testid="documento-aprovar"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-black text-white hover:bg-green-700 disabled:opacity-50">
              {ocupado ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Aprovar
            </button>
            <button type="button" disabled={ocupado || !campos.motivo.trim()} onClick={onRejeitar} data-testid="documento-rejeitar"
              className="flex min-h-11 items-center gap-2 rounded-xl bg-red-50 px-5 text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-50">
              <XCircle size={16} /> Rejeitar
            </button>
          </div>
          <p className="text-xs text-slate-500">Ao decidir, o arquivo é apagado: guardamos só o resumo e a validade.</p>
        </div>
      )}
    </article>
  )
}

// components/dashboard/dados-profissionais/AbaDocumento.tsx
// Abas "Seguro" e "CND": uma tela por fase, em linguagem simples. Só exibe e dispara ações do hook.
import { useState } from 'react'
import Link from 'next/link'
import { BadgeCheck, Hourglass, Loader2, ShieldQuestion } from 'lucide-react'
import { CartaoSecao, estiloCampo } from '@/components/perfil/CartaoSecao'
import { dataLimiteDoPedido, podeEnviar, PRAZO_PEDIDO_DIAS, textoVencimento, type TipoDocumento } from '@/lib/selos/documentos'
import type { DocumentoVerificacao } from '@/hooks/useDocumentoVerificacao'

const BOTAO =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-black text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'

const TEXTOS = {
  seguro: {
    titulo: 'Seguro de responsabilidade civil',
    explica: 'Se você já tem uma apólice de seguro de responsabilidade civil, envie o comprovante. Nossa equipe confere e o selo Ouro aparece no seu perfil. O PQF não vende nem indica seguro: só confere o que você já tem.',
    arquivo: 'Foto ou PDF da apólice (até 5 MB)',
    conquistado: 'Apólice de seguro conferida pela equipe do PQF.',
  },
  cnd: {
    titulo: 'Certidão negativa de débitos federais (CND)',
    explica: 'A CND é gratuita e sai na hora no site da Receita Federal (se não houver pendência). Envie o PDF; nossa equipe confere e o selo Diamante aparece no seu perfil. Ela vale 180 dias, então precisa ser renovada.',
    arquivo: 'PDF da certidão (até 5 MB)',
    conquistado: 'Certidão negativa de débitos federais conferida pela equipe do PQF.',
  },
} as const

export function AbaDocumento({ tipo, doc, temPerfil, nivelAnteriorOk }: {
  tipo: TipoDocumento
  doc: DocumentoVerificacao
  temPerfil: boolean
  /** Ouro exige Prata; Diamante exige Ouro. Só orienta: quem decide o nível é o banco. */
  nivelAnteriorOk: boolean
}) {
  const t = TEXTOS[tipo]
  const { fase, verificacao, carregando, enviando, erro, aviso, enviar } = doc
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [seguradora, setSeguradora] = useState('')
  const [apolice, setApolice] = useState('')
  const [validade, setValidade] = useState('')

  if (!temPerfil) {
    return (
      <CartaoSecao titulo={t.titulo} descricao="Salve os seus dados primeiro." icone={<ShieldQuestion size={20} />}>
        <p className="text-sm text-slate-600">Antes, termine de preencher e salvar a aba <strong>Meu perfil</strong>.</p>
      </CartaoSecao>
    )
  }
  if (carregando) return <div className="h-48 animate-pulse rounded-3xl bg-slate-100" role="status" aria-label="Carregando" />

  const enviadoEm = (verificacao?.dados?.pedido as { enviado_em?: string } | undefined)?.enviado_em
  const limiteIso = dataLimiteDoPedido(enviadoEm)
  const limite = limiteIso ? limiteIso.split('-').reverse().join('/') : null
  const rejeicao = (verificacao?.dados?.ultima_rejeicao ?? (fase === 'rejeitado' ? verificacao?.dados?.decisao : null)) as { motivo?: string | null } | null

  return (
    <div className="flex flex-col gap-6" data-testid={`doc-${tipo}`}>
      {(fase === 'aprovado' || fase === 'a_vencer') && verificacao?.valido_ate && (
        <CartaoSecao titulo="Selo conquistado" descricao="Ele aparece no seu perfil." icone={<BadgeCheck size={20} />}>
          <div className={`rounded-2xl p-4 ${fase === 'a_vencer' ? 'bg-amber-50 text-amber-900' : 'bg-green-50 text-green-900'}`} data-testid={`doc-${tipo}-fase-${fase}`}>
            <p className="text-sm font-bold">{t.conquistado}</p>
            <p className="mt-1 text-sm">{textoVencimento(verificacao.valido_ate)}</p>
            {fase === 'a_vencer' && <p className="mt-1 text-sm">Está perto de vencer. Envie o comprovante atualizado abaixo para manter o selo.</p>}
          </div>
        </CartaoSecao>
      )}

      {fase === 'em_conferencia' && (
        <CartaoSecao titulo="Estamos conferindo" descricao="Nossa equipe confere o seu comprovante." icone={<Hourglass size={20} />}>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900" data-testid={`doc-${tipo}-fase-conferencia`}>
            <p className="font-bold">Recebemos o seu comprovante. Assim que for conferido, o resultado aparece aqui.</p>
            {limite && (
              <p className="mt-2 font-semibold" data-testid={`doc-${tipo}-prazo`}>
                Prazo: se não houver decisão até {limite}, o arquivo é apagado e você poderá enviar de novo. Você não perde nada.
              </p>
            )}
          </div>
        </CartaoSecao>
      )}

      {podeEnviar(fase) && (
        <CartaoSecao titulo={t.titulo} descricao={fase === 'a_vencer' ? 'Renovar' : 'Como funciona'} icone={<ShieldQuestion size={20} />}>
          <p className="text-sm leading-relaxed text-slate-600">{t.explica}</p>
          {!nivelAnteriorOk && (
            <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600" data-testid={`doc-${tipo}-aviso-nivel`}>
              Você já pode enviar. O nível {tipo === 'seguro' ? 'Ouro' : 'Diamante'} aparece quando os selos anteriores estiverem conquistados.
            </p>
          )}
          {fase === 'rejeitado' && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
              Não conseguimos aprovar o último envio{rejeicao?.motivo ? `: ${rejeicao.motivo}` : '.'} Você pode enviar de novo.
            </p>
          )}
          {fase === 'pedido_expirado' && (
            <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900" data-testid={`doc-${tipo}-pedido-expirado`}>
              O seu último envio ficou mais de {PRAZO_PEDIDO_DIAS} dias sem decisão e o arquivo foi apagado. Foi uma demora nossa, não uma recusa: envie de novo quando puder.
            </p>
          )}
          {fase === 'expirado' && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">O selo venceu. Envie um comprovante atualizado.</p>}

          <p className="mt-3 text-xs leading-relaxed text-slate-500" data-testid={`doc-${tipo}-privacidade`}>
            Só a nossa equipe vê o arquivo. Ele é apagado assim que o pedido for decidido (ou em até {PRAZO_PEDIDO_DIAS} dias, se ninguém decidir). Guardamos apenas o resumo e a validade. Detalhes na <Link href="/privacidade" className="font-bold text-blue-700 underline">Política de Privacidade</Link>.
          </p>

          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              await enviar(arquivo, tipo === 'seguro' ? { seguradora, numeroApolice: apolice, validade } : undefined)
            }}
          >
            {tipo === 'seguro' && (
              <>
                <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
                  Seguradora
                  <input className={estiloCampo} value={seguradora} maxLength={80} onChange={(e) => setSeguradora(e.target.value)} data-testid="seguro-seguradora" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
                  Número da apólice
                  <input className={estiloCampo} value={apolice} maxLength={40} onChange={(e) => setApolice(e.target.value)} data-testid="seguro-apolice" />
                </label>
                <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
                  A apólice vale até
                  <input type="date" className={estiloCampo} value={validade} onChange={(e) => setValidade(e.target.value)} data-testid="seguro-validade" />
                </label>
              </>
            )}
            <label className="flex flex-col gap-1 text-sm font-bold text-slate-700">
              {t.arquivo}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                className="text-sm font-normal"
                data-testid={`doc-${tipo}-arquivo`}
              />
            </label>
            {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{erro}</p>}
            <button type="submit" disabled={enviando} className={BOTAO} data-testid={`doc-${tipo}-enviar`}>
              {enviando && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {enviando ? 'Enviando...' : fase === 'a_vencer' ? 'Enviar comprovante atualizado' : 'Enviar para conferência'}
            </button>
          </form>
        </CartaoSecao>
      )}

      {aviso && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-800">{aviso}</p>}
    </div>
  )
}

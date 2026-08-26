// components/acompanhamento/garantia/GarantiaRespondidaCliente.tsx

'use client'

import { useState } from 'react'
import { CheckCircle2, RotateCcw, Star, Loader2, AlertCircle } from 'lucide-react'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { confirmarResolucaoGarantia, reabrirCasoGarantia } from '@/lib/services/garantia.service'
import { GarantiaCarrossel } from '@/components/dashboard/wizard/garantia/GarantiaCarrossel'
import { GarantiaComentarios } from '@/components/dashboard/wizard/garantia/GarantiaComentarios'

interface Props {
  caso: CasoGarantia
  clienteUserId: string
  onAtualizado: () => void
}

export function GarantiaRespondidaCliente({ caso, clienteUserId, onAtualizado }: Props) {
  const wizard = useGarantiaWizard({
    casoId: caso.id,
    autorTipo: 'cliente',
    autorUserId: clienteUserId,
  })

  const [modo, setModo]                       = useState<'decidir' | 'confirmando'>('decidir')
  const [notaNova, setNotaNova]               = useState(0)
  const [descricaoResolucao, setDescricaoResolucao] = useState('')
  const [processando, setProcessando]         = useState(false)
  const [erro, setErro]                       = useState<string | null>(null)

  const handleConfirmarResolvido = async () => {
    if (caso.origem !== 'prestador' && (notaNova < 1 || notaNova > 5)) return
    if (processando) return
    setProcessando(true)
    setErro(null)
    try {
      const fotosResolucao = wizard.state.fotos
        .filter((f) => f.fase === 'resolucao')
        .map((f) => f.url_foto)

      await confirmarResolucaoGarantia(
        caso.id,
        clienteUserId,
        descricaoResolucao.trim(),
        fotosResolucao,
        caso.origem === 'prestador' ? undefined : notaNova,
      )

      // Promove fotos de resolução do bucket privado para o público —
      // feito após confirmar para garantir que só casos realmente resolvidos
      // têm fotos expostas. Falha silenciosa: não bloqueia o fluxo principal,
      // as fotos simplesmente não aparecerão no perfil público até a próxima
      // tentativa (pode ser re-trigada manualmente pelo admin se necessário).
      try {
        await fetch('/api/garantia/promover-fotos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ casoId: caso.id }),
        })
      } catch (erroPromocao) {
        console.error('[GarantiaRespondidaCliente] Erro ao promover fotos:', erroPromocao)
      }

      onAtualizado()
    } catch (err) {
      console.error('Erro ao confirmar resolução:', err)
      setErro('Não foi possível confirmar. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  const handleAindaNaoResolveu = async () => {
    if (processando) return
    setProcessando(true)
    setErro(null)
    try {
      await reabrirCasoGarantia(caso.id, clienteUserId)
      onAtualizado()
    } catch (err) {
      console.error('Erro ao reabrir caso:', err)
      setErro('Não foi possível reabrir o caso. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="space-y-4">
      {caso.resposta_prestador_garantia && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
            Proposta do prestador
          </p>
          <p className="text-[12px] font-medium text-slate-700 leading-snug">
            {caso.resposta_prestador_garantia}
          </p>
        </div>
      )}

      <GarantiaCarrossel wizard={wizard} podeEnviar autorTipo="cliente" />
      <GarantiaComentarios wizard={wizard} casoId={caso.id} />

      {modo === 'decidir' && (
        <div className="flex gap-2">
          <button
            onClick={() => setModo('confirmando')}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95"
          >
            <CheckCircle2 size={14} />
            Foi resolvido
          </button>
          <button
            onClick={handleAindaNaoResolveu}
            disabled={processando}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 disabled:bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95"
          >
            {processando ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            Ainda não resolveu
          </button>
        </div>
      )}

      {modo === 'confirmando' && (
        <div className="bg-white border-2 border-green-100 rounded-2xl p-5 space-y-4">
          {caso.origem === 'prestador' ? (
            <p className="text-[11px] text-slate-500 leading-snug">
              Este caso surgiu de uma oferta do prestador para reparar um problema já
              avaliado. A nota fica marcada como neutra automaticamente — não é possível
              dar 5 estrelas aqui, já que o prestador está corrigindo o próprio erro.
            </p>
          ) : (
            <>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-700">
                Como você avalia a resolução?
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setNotaNova(n)} className="p-1">
                    <Star
                      size={28}
                      className={n <= notaNova ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                    />
                  </button>
                ))}
              </div>
            </>
          )}

          <textarea
            value={descricaoResolucao}
            onChange={(e) => setDescricaoResolucao(e.target.value)}
            placeholder="Como foi a resolução? (opcional)"
            rows={2}
            className="w-full text-[12px] font-medium text-slate-700 border border-slate-200 rounded-xl p-3 outline-none focus:border-green-300 resize-none"
          />

          <button
            onClick={handleConfirmarResolvido}
            disabled={(caso.origem !== 'prestador' && notaNova < 1) || processando}
            className="w-full flex items-center justify-center gap-2 bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-black uppercase tracking-widest py-3 rounded-xl transition-all active:scale-95"
          >
            {processando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Confirmar
          </button>

          {erro && (
            <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
              <AlertCircle size={10} /> {erro}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

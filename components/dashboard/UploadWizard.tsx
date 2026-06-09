'use client'

import { useEffect, useRef } from 'react'
import { Projeto } from '@/hooks/usePortfolioDashboard'
import { useUploadWizard } from '@/hooks/useUploadWizard'
import { WizardCompleted } from './wizard/WizardCompleted'
import { WizardForm } from './wizard/WizardForm'
import { WizardZoomModal } from './wizard/WizardZoomModal'

type HookData = ReturnType<typeof useUploadWizard>

interface UploadWizardProps {
  prestadorId: number
  projetoExistente?: Projeto | null
  onComplete: () => void
  onHookReady?: (hookData: HookData) => void
  /** Exibe o cabeçalho interno com título + botão voltar */
  onVoltar?: () => void
  /** Define o label do cabeçalho interno */
  isEdicao?: boolean
}

export default function UploadWizard({
  prestadorId,
  projetoExistente = null,
  onComplete,
  onHookReady,
  onVoltar,
  isEdicao = false,
}: UploadWizardProps) {
  const hookData = useUploadWizard(prestadorId, projetoExistente)
  const { isProjetoConcluido } = hookData.derived
  const { zoomEtapa, clienteWhatsapp, clienteNome, titulo } = hookData.state

  const onHookReadyRef = useRef(onHookReady)
  onHookReadyRef.current = onHookReady

  useEffect(() => {
    onHookReadyRef.current?.(hookData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden max-w-xl mx-auto font-sans animate-in fade-in duration-500">

        {/* ── Cabeçalho interno discreto ── */}
        {onVoltar && (
          <div className="flex items-center justify-between px-7 pt-6 pb-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {isEdicao ? 'Gerenciando serviço' : 'Novo serviço'}
              </span>
              {/* Mostra título + cliente quando estiver editando e já tiver dados */}
              {isEdicao && titulo && (
                <span className="text-sm font-black text-slate-700 leading-tight truncate max-w-[16rem]">
                  {titulo}
                </span>
              )}
              {isEdicao && clienteNome && (
                <span className="text-[10px] text-slate-400 font-medium leading-none">
                  {clienteNome}
                  {clienteWhatsapp ? ` · ${clienteWhatsapp}` : ''}
                </span>
              )}
            </div>
            <button
              onClick={onVoltar}
              className="px-3 py-1.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shrink-0"
            >
              ← Voltar
            </button>
          </div>
        )}

        {isProjetoConcluido ? (
          <WizardCompleted hookData={hookData} />
        ) : (
          <WizardForm hookData={hookData} />
        )}
      </div>

      {zoomEtapa && (
        <WizardZoomModal hookData={hookData} />
      )}
    </>
  )
}
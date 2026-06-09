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
  /** Callback opcional: entrega hookData ao pai para alimentar WizardTimeline */
  onHookReady?: (hookData: HookData) => void
}

export default function UploadWizard({
  prestadorId,
  projetoExistente = null,
  onComplete,
  onHookReady,
}: UploadWizardProps) {
  const hookData = useUploadWizard(prestadorId, projetoExistente)
  const { isProjetoConcluido } = hookData.derived
  const { zoomEtapa } = hookData.state

  // Entrega hookData ao pai numa ref estável (sem loop de render)
  const onHookReadyRef = useRef(onHookReady)
  onHookReadyRef.current = onHookReady

  useEffect(() => {
    onHookReadyRef.current?.(hookData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden max-w-xl mx-auto font-sans animate-in fade-in duration-500">
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
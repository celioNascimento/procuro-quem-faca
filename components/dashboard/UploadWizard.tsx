'use client'

import { Projeto } from '@/hooks/usePortfolioDashboard'
import { useUploadWizard } from '@/hooks/useUploadWizard'
import { WizardCompleted } from './wizard/WizardCompleted'
import { WizardForm } from './wizard/WizardForm'
import { WizardZoomModal } from './wizard/WizardZoomModal'

// A tipagem correta para o componente pai
interface UploadWizardProps {
  prestadorId: string | number;
  projetoExistente?: Projeto | null
  onComplete: () => void
}

export default function UploadWizard({ prestadorId, projetoExistente = null, onComplete }: UploadWizardProps) {
  // Inicializa o hook central passando as variáveis que vieram do Dashboard
  const hookData = useUploadWizard(prestadorId, projetoExistente)
  const { isProjetoConcluido } = hookData.derived
  const { zoomEtapa } = hookData.state

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
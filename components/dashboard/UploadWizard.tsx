'use client'

import { useEffect, useRef } from 'react'
import { Phone, User, Briefcase } from 'lucide-react'
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
  onVoltar?: () => void
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
  const { zoomEtapa, clienteWhatsapp, clienteNome, titulo, prestadorInfo } = hookData.state

  const onHookReadyRef = useRef(onHookReady)
  onHookReadyRef.current = onHookReady

  useEffect(() => {
    onHookReadyRef.current?.(hookData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const temDadosCliente = !!(clienteNome || clienteWhatsapp || titulo)

  return (
    <>
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden w-full font-sans animate-in fade-in duration-500">

        {/* ── Hero card ── */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 px-6 pt-6 pb-8 overflow-hidden">
          {/* Círculos decorativos */}
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute top-8 -right-2 w-16 h-16 rounded-full bg-white/10" />

          {/* Botão voltar */}
          {onVoltar && (
            <button
              onClick={onVoltar}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-white/30 transition-all active:scale-95"
            >
              ← Voltar
            </button>
          )}

          {/* Avatar + nome do prestador */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/20 border-2 border-white/40 shrink-0 shadow-lg">
              {prestadorInfo.foto ? (
                <img
                  src={prestadorInfo.foto}
                  alt={prestadorInfo.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-white/70 text-xl font-black">
                    {prestadorInfo.nome?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-white/70 text-[9px] font-black uppercase tracking-widest leading-none mb-0.5">
                {isEdicao ? 'Gerenciando serviço' : 'Novo serviço'}
              </p>
              <p className="text-white font-black text-base leading-tight truncate">
                {prestadorInfo.nome || '—'}
              </p>
              {prestadorInfo.slug && (
                <p className="text-white/60 text-[10px] font-medium leading-none mt-0.5">
                  @{prestadorInfo.slug}
                </p>
              )}
            </div>
          </div>

          {/* Dados do cliente — só exibe quando preenchidos */}
          {temDadosCliente && (
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 space-y-2 border border-white/20">
              {titulo && (
                <div className="flex items-center gap-2">
                  <Briefcase size={11} className="text-white/70 shrink-0" />
                  <span className="text-white text-[11px] font-black truncate">{titulo}</span>
                </div>
              )}
              {clienteNome && (
                <div className="flex items-center gap-2">
                  <User size={11} className="text-white/70 shrink-0" />
                  <span className="text-white/90 text-[11px] font-semibold truncate">{clienteNome}</span>
                </div>
              )}
              {clienteWhatsapp && (
                <div className="flex items-center gap-2">
                  <Phone size={11} className="text-white/70 shrink-0" />
                  <span className="text-white/90 text-[11px] font-semibold">{clienteWhatsapp}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Conteúdo do wizard (sem passar onVoltar — não existe na interface) ── */}
        <div className="p-5">
          {isProjetoConcluido ? (
            <WizardCompleted hookData={hookData} />
          ) : (
            <WizardForm hookData={hookData} />
          )}
        </div>
      </div>

      {zoomEtapa && (
        <WizardZoomModal hookData={hookData} />
      )}
    </>
  )
}
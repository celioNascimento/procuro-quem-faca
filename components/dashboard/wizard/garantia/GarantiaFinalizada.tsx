// components/dashboard/wizard/garantia/GarantiaFinalizada.tsx
//
// Estados terminais: resolvida, sem_resposta, recusada.
// Exibe o histórico completo do caso — problema, proposta, resolução,
// fotos e conversa — para o prestador rever o que aconteceu.

'use client'

import { CheckCircle2, XCircle, ShieldOff, AlertTriangle } from 'lucide-react'
import type { CasoGarantia } from '@/hooks/useCasoGarantiaDoProjeto'
import { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { GarantiaCarrossel } from './GarantiaCarrossel'

interface Props {
  caso: CasoGarantia
  prestadorId: number
}

const CONFIG_STATUS = {
  resolvida: {
    icon: CheckCircle2,
    cor: 'text-green-600 bg-green-50 border-green-200',
    titulo: 'Garantia resolvida',
    descricao: null, // usa resolucao_descricao do caso
  },
  sem_resposta: {
    icon: ShieldOff,
    cor: 'text-red-600 bg-red-50 border-red-200',
    titulo: 'Prazo de resposta perdido',
    descricao: 'O prazo para resposta expirou. Isso afeta sua reputação no perfil público.',
  },
  recusada: {
    icon: XCircle,
    cor: 'text-slate-500 bg-slate-50 border-slate-200',
    titulo: 'Oferta recusada pelo cliente',
    descricao: 'O cliente optou por não aceitar a oferta de reparo.',
  },
} as const

export function GarantiaFinalizada({ caso, prestadorId }: Props) {
  const wizard = useGarantiaWizard({
    casoId: caso.id,
    autorTipo: 'prestador',
    autorUserId: null, // somente leitura — não faz upload nem comentários
  })

  const config = CONFIG_STATUS[caso.status as keyof typeof CONFIG_STATUS]
  if (!config) return null
  const Icon = config.icon

  const textoDescricao = config.descricao
    ?? (caso.status === 'resolvida' ? caso.resolucao_descricao : null)

  return (
    <div className="space-y-4">

      {/* Badge de resultado */}
      <div className={`rounded-2xl p-5 border flex items-start gap-3 ${config.cor}`}>
        <Icon size={18} className="shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-wide leading-none">
            {config.titulo}
          </p>
          {textoDescricao && (
            <p className="text-[11px] font-medium leading-snug opacity-80">
              {textoDescricao}
            </p>
          )}
        </div>
      </div>

      {/* Problema relatado pelo cliente */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">
            Problema relatado
          </p>
          <p className="text-[11px] font-medium text-orange-700/80 leading-snug">
            {caso.descricao_problema}
          </p>
        </div>
      </div>

      {/* Proposta registrada pelo prestador */}
      {caso.resposta_prestador_garantia && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={12} className="text-blue-400" />
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Sua proposta registrada
            </p>
          </div>
          <p className="text-[12px] font-medium text-slate-700 leading-snug">
            {caso.resposta_prestador_garantia}
          </p>
        </div>
      )}

      {/* Fotos — clicáveis via GarantiaCarrossel + GarantiaZoomModal */}
      <GarantiaCarrossel
        wizard={wizard}
        podeEnviar={false}
        autorTipo="prestador"
      />

      {/* Histórico de conversa — somente leitura, sem input.
          Exibe as mensagens trocadas durante o caso, mas não permite
          novas mensagens após o encerramento. */}
      {wizard.derived.comentariosGerais.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
            Conversa
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {wizard.derived.comentariosGerais.map((c) => (
              <div
                key={c.id}
                className={`text-[11px] rounded-xl px-3 py-2 max-w-[85%] ${
                  c.autor_tipo === 'prestador'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-white text-slate-700 border border-slate-100'
                }`}
              >
                {c.texto}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

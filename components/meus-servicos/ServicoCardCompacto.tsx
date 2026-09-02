// components/meus-servicos/ServicoCardCompacto.tsx
//
// Card compacto reutilizável — usado em /painel/perfil (grid de projetos).
// Responsabilidade única: renderizar um projeto em formato compacto
// (foto pequena + badge + título + chevron), sem lógica de rota ou status.
// Toda decisão de "o que mostrar" e "para onde ir" vem de fora via props.

'use client'
import { ChevronRight, ShieldAlert } from 'lucide-react'
import type { ClienteServico } from '@/types/clienteServicos'

interface StatusInfo {
  label: string
  dot: string
  badge: string
  urgente: boolean
}

interface Props {
  servico: ClienteServico
  statusInfo: StatusInfo
  // Tipo do caso ativo (garantia formal ou reclamação), ou null/undefined
  // quando não há caso ativo. Aplica estilo laranja completo ao card
  // (borda + ring na foto + badge + chevron) — mesma linguagem visual do
  // banner de garantia/reclamação, com o texto do badge variando por tipo.
  tipoGarantiaAtiva?: 'garantia' | 'reclamacao' | null
  temGarantiaAtiva?: boolean
  onClick: () => void
}

export default function ServicoCardCompacto({
  servico,
  statusInfo,
  tipoGarantiaAtiva = null,
  temGarantiaAtiva = false,
  onClick,
}: Props) {
  const temCasoAtivo = tipoGarantiaAtiva !== null || temGarantiaAtiva
  const ehReclamacao = tipoGarantiaAtiva === 'reclamacao'

  const badgeLabel = temCasoAtivo ? (ehReclamacao ? 'Reclamação' : 'Garantia') : statusInfo.label
  const badgeClass = temCasoAtivo ? 'bg-orange-50 text-orange-700 border-orange-200' : statusInfo.badge
  const dotClass   = temCasoAtivo ? 'bg-orange-400'                     : statusInfo.dot
  const isUrgente  = temCasoAtivo || statusInfo.urgente

  // Estilos do card raiz
  const cardClass = temCasoAtivo
    ? 'border-orange-200 shadow-sm shadow-orange-50 focus-visible:ring-orange-100'
    : isUrgente
      ? 'border-blue-200 shadow-sm shadow-blue-50 focus-visible:ring-blue-100'
      : 'border-slate-200 shadow-sm hover:border-blue-200 focus-visible:ring-blue-100'

  // Ring na foto
  const fotoRingClass = temCasoAtivo
    ? 'ring-2 ring-orange-400'
    : isUrgente
      ? 'ring-2 ring-blue-400'
      : ''

  // Chevron
  const chevronClass = temCasoAtivo
    ? 'bg-orange-500 text-white'
    : isUrgente
      ? 'bg-blue-600 text-white'
      : 'bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'

  return (
    <button
      onClick={onClick}
      type="button"
      className={`group flex min-h-[7rem] w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 active:translate-y-0 ${cardClass}`}
    >
      {/* Foto do prestador com dot de status */}
      <div className={`relative shrink-0 rounded-2xl p-0.5 ${fotoRingClass}`}>
        <div className="w-14 h-14 rounded-[14px] overflow-hidden">
          <img
            src={servico.prestadores?.foto_perfil || '/placeholder-avatar.png'}
            className="w-full h-full object-cover"
            alt={servico.prestadores?.nome ?? 'Prestador'}
          />
        </div>
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${dotClass} ${isUrgente ? 'animate-pulse' : ''}`}
        />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border tracking-wider shrink-0 flex items-center gap-1 ${badgeClass}`}>
            {temCasoAtivo && <ShieldAlert size={8} />}
            {badgeLabel}
          </span>
          {servico.prestadores?.categoria?.nome && (
            <span className="text-[9px] text-slate-400 truncate">
              {servico.prestadores.categoria.nome}
            </span>
          )}
        </div>
        <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">
          {servico.titulo}
        </p>
        <p className="text-[12px] text-slate-500 truncate mt-0.5">
          {servico.prestadores?.nome}
        </p>
      </div>

      {/* Chevron */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${chevronClass}`}>
        <ChevronRight size={16} strokeWidth={2.5} />
      </div>
    </button>
  )
}

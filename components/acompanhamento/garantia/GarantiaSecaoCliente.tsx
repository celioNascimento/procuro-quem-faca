// components/acompanhamento/garantia/GarantiaSecaoCliente.tsx
//
// Seção de garantia/reclamação exibida na página /acompanhamento/[token],
// abaixo da LinhaDeTempo original — "continuação" da timeline, espelhando
// o mesmo posicionamento usado do lado do prestador (GarantiaSecaoWizard).
//
// Recebe caso/loading/recarregar via props (lifting feito na page.tsx) —
// evita query duplicada já que a page precisa do caso para derivar
// temGarantiaAtiva e repassar para CardPrestador/StatusMini/LinhaDeTempo.
//
// Antes do caso existir, o "tipo" (garantia vs reclamação) só é conhecido
// via elegibilidade (verificarElegibilidadeGarantia) — por isso o título
// do formulário de abertura usa elegibilidade.tipo, não caso?.tipo.

'use client'

import { useState, useEffect } from 'react'
import { verificarElegibilidadeGarantia } from '@/lib/services/garantia.service'
import { GarantiaFormAbertura }           from './GarantiaFormAbertura'
import { GarantiaAguardandoAceiteCliente } from './GarantiaAguardandoAceiteCliente'
import { GarantiaAbertaCliente }          from './GarantiaAbertaCliente'
import { GarantiaRespondidaCliente }      from './GarantiaRespondidaCliente'
import { GarantiaFinalizadaCliente }      from './GarantiaFinalizadaCliente'
import { ShieldCheck, MessageCircleWarning, Loader2 } from 'lucide-react'
import type { CasoGarantia }             from '@/hooks/useCasoGarantiaDoProjeto'

interface Props {
  projetoId: string
  clienteUserId: string
  // Lifting: caso e controle de carregamento vêm da page.tsx,
  // que já buscou via useCasoGarantiaDoProjeto.
  caso: CasoGarantia | null
  loadingCaso: boolean
  recarregar: () => void
}

interface Elegibilidade {
  elegivel: boolean
  motivo: string
  tipo?: 'garantia' | 'reclamacao'
}

export function GarantiaSecaoCliente({
  projetoId,
  clienteUserId,
  caso,
  loadingCaso,
  recarregar,
}: Props) {
  const [elegibilidade,       setElegibilidade]       = useState<Elegibilidade | null>(null)
  const [loadingElegibilidade, setLoadingElegibilidade] = useState(true)

  useEffect(() => {
    if (caso || loadingCaso) {
      setLoadingElegibilidade(false)
      return
    }
    verificarElegibilidadeGarantia(projetoId)
      .then((r) => setElegibilidade({ elegivel: r.elegivel, motivo: r.motivo, tipo: r.tipo }))
      .catch(() => setElegibilidade({ elegivel: false, motivo: 'erro' }))
      .finally(() => setLoadingElegibilidade(false))
  }, [projetoId, caso, loadingCaso])

  if (loadingCaso || loadingElegibilidade) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-slate-300" />
      </div>
    )
  }

  // Sem caso ainda — mostra elegibilidade / formulário de abertura
  if (!caso) {
    if (!elegibilidade?.elegivel) {
      if (elegibilidade?.motivo === 'fora_do_prazo') {
        return (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {elegibilidade.tipo === 'reclamacao'
                ? 'Prazo para reclamar deste serviço encerrado'
                : 'Prazo de garantia deste serviço encerrado'}
            </p>
          </div>
        )
      }
      return null
    }

    const ehReclamacao = elegibilidade.tipo === 'reclamacao'

    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          {ehReclamacao
            ? <MessageCircleWarning size={16} className="text-orange-500" />
            : <ShieldCheck size={16} className="text-blue-500" />}
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {ehReclamacao ? 'Teve algum problema?' : 'Garantia deste serviço'}
          </h3>
        </div>
        <GarantiaFormAbertura
          projetoId={projetoId}
          clienteUserId={clienteUserId}
          tipo={elegibilidade.tipo ?? 'garantia'}
          onAberto={recarregar}
        />
      </div>
    )
  }

  // Caso existe — delega por status
  const ehReclamacao = caso.tipo === 'reclamacao'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
          {ehReclamacao ? 'Reclamação' : 'Garantia'}
        </span>
        <span className="text-[9px] font-medium text-slate-400">
          Continuação deste projeto
        </span>
      </div>

      {caso.status === 'aguardando_aceite_cliente' && (
        <GarantiaAguardandoAceiteCliente caso={caso} onAtualizado={recarregar} />
      )}

      {caso.status === 'aberta' && (
        <GarantiaAbertaCliente caso={caso} clienteUserId={clienteUserId} />
      )}

      {caso.status === 'respondida' && (
        <GarantiaRespondidaCliente caso={caso} clienteUserId={clienteUserId} onAtualizado={recarregar} />
      )}

      {['resolvida', 'sem_resposta', 'recusada'].includes(caso.status) && (
        <GarantiaFinalizadaCliente caso={caso} clienteUserId={clienteUserId} />
      )}
    </div>
  )
}

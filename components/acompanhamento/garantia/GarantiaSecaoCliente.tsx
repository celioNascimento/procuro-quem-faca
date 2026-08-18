// components/acompanhamento/garantia/GarantiaSecaoCliente.tsx
//
// Seção de garantia exibida na página /acompanhamento/[token], abaixo da
// LinhaDeTempo original — "continuação" da timeline, espelhando o mesmo
// posicionamento usado do lado do prestador (GarantiaSecaoWizard).
//
// Dois estados possíveis:
//  1. Sem caso de garantia ainda: mostra elegibilidade (dentro do prazo do
//     prestador?) e, se elegível, o formulário para abrir um caso.
//  2. Com caso existente: delega para os mesmos subcomponentes por status
//     usados do lado do prestador — a timeline de garantia é a MESMA para
//     os dois lados (mesmo caso, mesmas fotos, mesmos comentários), só a
//     ação disponível muda conforme quem está vendo.

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCasoGarantiaDoProjeto } from '@/hooks/useCasoGarantiaDoProjeto'
import { verificarElegibilidadeGarantia } from '@/lib/services/garantia.service'
import { GarantiaFormAbertura } from './GarantiaFormAbertura'
import { GarantiaAguardandoAceiteCliente } from './GarantiaAguardandoAceiteCliente'
import { GarantiaAbertaCliente } from './GarantiaAbertaCliente'
import { GarantiaRespondidaCliente } from './GarantiaRespondidaCliente'
import { GarantiaFinalizadaCliente } from './GarantiaFinalizadaCliente'
import { ShieldCheck, Loader2 } from 'lucide-react'

interface Props {
  projetoId: string
  clienteUserId: string
}

interface Elegibilidade {
  elegivel: boolean
  motivo: string
}

export function GarantiaSecaoCliente({ projetoId, clienteUserId }: Props) {
  const { caso, loading: loadingCaso, recarregar } = useCasoGarantiaDoProjeto(projetoId)
  const [elegibilidade, setElegibilidade] = useState<Elegibilidade | null>(null)
  const [loadingElegibilidade, setLoadingElegibilidade] = useState(true)

  useEffect(() => {
    // Só precisa checar elegibilidade quando ainda não existe caso —
    // se já existe, a existência dele já prova que era elegível na abertura.
    if (caso || loadingCaso) {
      setLoadingElegibilidade(false)
      return
    }
    verificarElegibilidadeGarantia(projetoId)
      .then((r) => setElegibilidade({ elegivel: r.elegivel, motivo: r.motivo }))
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
      // Motivos silenciosos (não vale exibir nada): prestador sem garantia
      // declarada, ou projeto ainda não finalizado. Só a expiração do prazo
      // merece uma mensagem — é a única situação onde o cliente pode achar
      // estranho não ver mais a opção.
      if (elegibilidade?.motivo === 'fora_do_prazo') {
        return (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Prazo de garantia deste serviço encerrado
            </p>
          </div>
        )
      }
      return null
    }

    return (
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Garantia deste serviço
          </h3>
        </div>
        <GarantiaFormAbertura
          projetoId={projetoId}
          clienteUserId={clienteUserId}
          onAberto={recarregar}
        />
      </div>
    )
  }

  // Caso existe — delega por status. Mesma timeline compartilhada com o
  // prestador; cada subcomponente Cliente define a ação disponível do
  // lado do cliente para aquele status.
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
          Garantia
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

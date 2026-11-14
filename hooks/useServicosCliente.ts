// hooks/useServicosCliente.ts

'use client'
import { supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as ClienteService from '@/lib/services/cliente.service'
import type { ClienteServico } from '@/types/clienteServicos'
import { estaProntoParaAvaliar, statusVisualDoServico } from '@/lib/painel/statusDoServico'

export function useServicosCliente(perfilCarregado: boolean) {
  const router    = useRouter()
  const filtroRef = useRef<HTMLDivElement>(null)

  const [servicos,        setServicos]        = useState<ClienteServico[]>([])
  const [filtroStatus,    setFiltroStatus]    = useState('todos')
  const [loadingServicos, setLoadingServicos] = useState(true)

  useEffect(() => {
    if (!perfilCarregado) return
    let cancelado = false

    async function buscar() {
      setLoadingServicos(true)
      try {
        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) {
          if (!cancelado) setServicos([])
          return
        }
        const data = await ClienteService.fetchClienteServicos(userData.user.id)
        if (cancelado) return
        setServicos(data)
      } finally {
        if (!cancelado) setLoadingServicos(false)
      }
    }

    buscar()
    return () => { cancelado = true }
  }, [perfilCarregado])

  // Derivados localmente — sem estado próprio nem query separada.
  // Separados por tipo: garantia (formal, garantia_dias > 0) e reclamação
  // (prestador sem garantia_dias) viram filtros distintos na lista, mesmo
  // usando a mesma máquina de estados por baixo (ver garantia.service.ts).
  const casoAtivoDoServico = (s: ClienteServico) =>
    (s.solicitacoes_garantia ?? []).find(g =>
      ['aguardando_aceite_cliente', 'aberta', 'respondida'].includes(g.status),
    )

  const servicosGarantia = servicos.filter(s => casoAtivoDoServico(s)?.tipo === 'garantia')
  const servicosReclamacao = servicos.filter(s => casoAtivoDoServico(s)?.tipo === 'reclamacao')
  const idsComGarantiaAtiva = new Set(servicosGarantia.map(s => s.id))
  const idsComReclamacaoAtiva = new Set(servicosReclamacao.map(s => s.id))

  // ── Contadores ──────────────────────────────────────────────────────────────
  const avaliarCount = servicos.filter(s =>
    s.status === 'em_execucao' && estaProntoParaAvaliar(s)
  ).length

  const ativosCount = servicos.filter(s =>
    s.status === 'pendente' || s.status === 'em_execucao'
  ).length

  const garantiaCount = servicosGarantia.length
  const reclamacaoCount = servicosReclamacao.length

  // Números dos filtros: saem da mesma regra que monta a lista, para o número do botão
  // ser sempre igual ao que aparece ao tocar nele.
  const pendentesCount   = servicos.filter(s => s.status?.toLowerCase() === 'pendente').length
  const andamentoCount   = servicos.filter(s => s.status?.toLowerCase() === 'em_execucao' && !estaProntoParaAvaliar(s)).length
  const finalizadosCount = servicos.filter(s => s.status?.toLowerCase() === 'finalizado').length

  // ── Filtro de lista ─────────────────────────────────────────────────────────
  const servicosFiltrados = filtroStatus === 'garantia'
    ? servicosGarantia
    : filtroStatus === 'reclamacao'
    ? servicosReclamacao
    : servicos.filter(s => {
        const st       = s.status?.toLowerCase()
        const pronto   = estaProntoParaAvaliar(s)
        if (filtroStatus === 'todos')       return true
        if (filtroStatus === 'pendente')    return st === 'pendente'
        if (filtroStatus === 'andamento')   return st === 'em_execucao' && !pronto
        if (filtroStatus === 'avaliar')     return st === 'em_execucao' && pronto
        if (filtroStatus === 'finalizados') return st === 'finalizado'
        return true
      })

  // ── Status visual ───────────────────────────────────────────────────────────
  const getStatusInfo = (servico: ClienteServico) =>
    statusVisualDoServico({
      status: servico.status,
      pronto: estaProntoParaAvaliar(servico),
      jaAvaliado: servico.avaliacoes?.length > 0,
      caso: idsComGarantiaAtiva.has(servico.id) ? 'garantia' : idsComReclamacaoAtiva.has(servico.id) ? 'reclamacao' : null,
    })

  // ── Rotas ───────────────────────────────────────────────────────────────────
  const getRotaDestino = (s: ClienteServico) => {
    const status       = s.status?.toLowerCase()
    const pronto       = estaProntoParaAvaliar(s)
    const jaAvaliado   = s.avaliacoes?.length > 0

    if (status === 'pendente')
      return `/meus-servicos?token=${encodeURIComponent(s.avaliacao_token)}`

    if (status === 'em_execucao' && !pronto)
      return `/acompanhamento/${s.avaliacao_token}`

    if (status === 'em_execucao' && pronto)
      return `/avaliar/${s.avaliacao_token}`

    // Finalizado — se já avaliou, vai para acompanhamento (onde vive a garantia);
    // se ainda não avaliou, vai para a página de avaliação.
    if (status === 'finalizado' && jaAvaliado)
      return `/acompanhamento/${s.avaliacao_token}`

    if (status === 'finalizado')
      return `/avaliar/${s.avaliacao_token}`

    return `/acompanhamento/${s.avaliacao_token}`
  }

  const getRotaGarantia = (s: ClienteServico) =>
    `/acompanhamento/${s.avaliacao_token}?garantia=1`

  // Rota unificada considerando filtro ativo e caso ativo (garantia OU
  // reclamação — ambos abrem a mesma seção via ?garantia=1, que já lida
  // com os dois tipos internamente).
  const getRota = (s: ClienteServico) => {
    if (filtroStatus === 'garantia' || filtroStatus === 'reclamacao') return getRotaGarantia(s)
    if (idsComGarantiaAtiva.has(s.id) || idsComReclamacaoAtiva.has(s.id)) return getRotaGarantia(s)
    return getRotaDestino(s)
  }

  const irParaAvaliar = (setAba: (v: string) => void) => {
    setAba('servicos')
    setFiltroStatus('avaliar')
    setTimeout(() => {
      filtroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return {
    filtroRef,
    servicos,
    servicosGarantia,
    servicosReclamacao,
    idsComGarantiaAtiva,
    idsComReclamacaoAtiva,
    filtroStatus, setFiltroStatus,
    loadingServicos,
    servicosFiltrados,
    avaliarCount,
    ativosCount,
    garantiaCount,
    reclamacaoCount,
    pendentesCount,
    andamentoCount,
    finalizadosCount,
    getStatusInfo,
    getRotaDestino,
    getRotaGarantia,
    getRota,
    irParaAvaliar,
  }
}

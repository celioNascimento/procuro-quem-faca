// hooks/useServicosCliente.ts

'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as ClienteService from '@/lib/services/cliente.service'
import type { ClienteServico } from '@/types/clienteServicos'

/**
 * Deriva se um serviço em execução já está pronto para o cliente avaliar.
 *
 * Fluxo com fotos: equivalente a ter a foto 3 (etapa "Depois") enviada.
 * Fluxo sem_fotos: equivalente ao prestador ter clicado em "Marcar como
 * concluído" (marcado_concluido_at preenchido) — não há foto 3 para checar,
 * já que portfolio_fotos é sempre vazio nesse fluxo.
 *
 * Centralizada aqui porque a mesma checagem era repetida em 4 lugares
 * deste hook usando só a condição do fluxo com fotos, o que fazia
 * projetos sem_fotos nunca aparecerem como prontos para avaliar.
 */
function estaProntoParaAvaliar(s: ClienteServico): boolean {
  if (s.sem_fotos) return !!s.marcado_concluido_at
  return s.portfolio_fotos?.some(f => f.ordem === 3) ?? false
}

export function useServicosCliente(whatsapp: string, perfilCarregado: boolean) {
  const router    = useRouter()
  const filtroRef = useRef<HTMLDivElement>(null)

  const [servicos,        setServicos]        = useState<ClienteServico[]>([])
  const [filtroStatus,    setFiltroStatus]    = useState('todos')
  const [loadingServicos, setLoadingServicos] = useState(true)

  useEffect(() => {
    if (!perfilCarregado) return
    if (!whatsapp) {
      setServicos([])
      setLoadingServicos(false)
      return
    }

    let cancelado = false

    async function buscar() {
      setLoadingServicos(true)
      try {
        const data = await ClienteService.fetchClienteServicos(whatsapp)
        if (cancelado) return
        setServicos(data)
      } finally {
        if (!cancelado) setLoadingServicos(false)
      }
    }

    buscar()
    return () => { cancelado = true }
  }, [whatsapp, perfilCarregado])

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
  const getStatusInfo = (servico: ClienteServico) => {
    const s          = servico?.status?.toLowerCase()
    const pronto      = estaProntoParaAvaliar(servico)
    const jaAvaliado = servico?.avaliacoes?.length > 0

    if (s === 'pendente')
      return { label: 'Aguardando aceite', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   urgente: false }
    if (s === 'em_execucao' && pronto)
      return { label: 'Avaliar agora',     dot: 'bg-blue-500',   badge: 'bg-blue-600 text-white border-blue-600',         urgente: true  }
    if (s === 'em_execucao')
      return { label: 'Em andamento',      dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200',       urgente: false }
    if (s === 'finalizado' && jaAvaliado)
      return { label: 'Concluído',         dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700 border-green-200',    urgente: false }
    if (s === 'finalizado')
      return { label: 'Finalizado',        dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700 border-green-200',    urgente: false }
    return   { label: s ?? '',             dot: 'bg-slate-300',  badge: 'bg-slate-50 text-slate-500 border-slate-200',    urgente: false }
  }

  // ── Rotas ───────────────────────────────────────────────────────────────────
  const getRotaDestino = (s: ClienteServico) => {
    const pronto      = estaProntoParaAvaliar(s)
    const jaAvaliado = s.avaliacoes?.length > 0
    const temAvaliacaoDoPrestador = s.avaliacoes_clientes?.length > 0

    if (s.status === 'pendente')
      return `/meus-servicos?token=${s.avaliacao_token}`

    if (s.status === 'em_execucao' && !pronto)
      return `/acompanhamento/${s.avaliacao_token}`

    if (s.status === 'em_execucao' && pronto)
      return `/avaliar/${s.avaliacao_token}`

    // Finalizado — se o prestador já avaliou o cliente, o clique deve abrir
    // o acompanhamento para exibir esse feedback no detalhe do projeto.
    if (s.status === 'finalizado' && (jaAvaliado || temAvaliacaoDoPrestador))
      return `/acompanhamento/${s.avaliacao_token}`

    if (s.status === 'finalizado')
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
    getStatusInfo,
    getRotaDestino,
    getRotaGarantia,
    getRota,
    irParaAvaliar,
  }
}

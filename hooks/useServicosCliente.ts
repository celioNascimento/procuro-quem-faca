// hooks/useServicosCliente.ts

'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as ClienteService from '@/lib/services/cliente.service'
import { temGarantiaAtiva } from '@/lib/services/cliente.service'
import type { ClienteServico } from '@/types/clienteServicos'

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
  const servicosGarantia    = servicos.filter(temGarantiaAtiva)
  const idsComGarantiaAtiva = new Set(servicosGarantia.map(s => s.id))

  // ── Contadores ──────────────────────────────────────────────────────────────
  const avaliarCount = servicos.filter(s =>
    s.status === 'em_execucao' && s.portfolio_fotos?.some(f => f.ordem === 3)
  ).length

  const ativosCount = servicos.filter(s =>
    s.status === 'pendente' || s.status === 'em_execucao'
  ).length

  const garantiaCount = servicosGarantia.length

  // ── Filtro de lista ─────────────────────────────────────────────────────────
  const servicosFiltrados = filtroStatus === 'garantia'
    ? servicosGarantia
    : servicos.filter(s => {
        const st       = s.status?.toLowerCase()
        const temFoto3 = s.portfolio_fotos?.some(f => f.ordem === 3)
        if (filtroStatus === 'todos')       return true
        if (filtroStatus === 'pendente')    return st === 'pendente'
        if (filtroStatus === 'andamento')   return st === 'em_execucao' && !temFoto3
        if (filtroStatus === 'avaliar')     return st === 'em_execucao' && temFoto3
        if (filtroStatus === 'finalizados') return st === 'finalizado'
        return true
      })

  // ── Status visual ───────────────────────────────────────────────────────────
  const getStatusInfo = (servico: ClienteServico) => {
    const s         = servico?.status?.toLowerCase()
    const temFoto3  = servico?.portfolio_fotos?.some(f => f.ordem === 3)
    const jaAvaliado = servico?.avaliacoes?.length > 0

    if (s === 'pendente')
      return { label: 'Aguardando aceite', dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',   urgente: false }
    if (s === 'em_execucao' && temFoto3)
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
    const temFoto3   = s.portfolio_fotos?.some(f => f.ordem === 3)
    const jaAvaliado = s.avaliacoes?.length > 0

    if (s.status === 'pendente')
      return `/meus-servicos?token=${s.avaliacao_token}`

    if (s.status === 'em_execucao' && !temFoto3)
      return `/acompanhamento/${s.avaliacao_token}`

    if (s.status === 'em_execucao' && temFoto3)
      return `/avaliar/${s.avaliacao_token}`

    // Finalizado — se já avaliou, vai para acompanhamento (onde vive a garantia);
    // se ainda não avaliou, vai para a página de avaliação.
    if (s.status === 'finalizado' && jaAvaliado)
      return `/acompanhamento/${s.avaliacao_token}`

    if (s.status === 'finalizado')
      return `/avaliar/${s.avaliacao_token}`

    return `/acompanhamento/${s.avaliacao_token}`
  }

  const getRotaGarantia = (s: ClienteServico) =>
    `/acompanhamento/${s.avaliacao_token}?garantia=1`

  // Rota unificada considerando filtro ativo e garantia ativa.
  const getRota = (s: ClienteServico) => {
    if (filtroStatus === 'garantia')       return getRotaGarantia(s)
    if (idsComGarantiaAtiva.has(s.id))     return getRotaGarantia(s)
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
    idsComGarantiaAtiva,
    filtroStatus, setFiltroStatus,
    loadingServicos,
    servicosFiltrados,
    avaliarCount,
    ativosCount,
    garantiaCount,
    getStatusInfo,
    getRotaDestino,
    getRotaGarantia,
    getRota,
    irParaAvaliar,
  }
}

//hooks/useServicosCliente.ts

'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import * as ClienteService from '@/lib/services/cliente.service'

export function useServicosCliente(whatsapp: string) {
  const router = useRouter()
  const filtroRef = useRef<HTMLDivElement>(null)

  const [servicos, setServicos]             = useState<any[]>([])
  const [filtroStatus, setFiltroStatus]     = useState('todos')
  const [loadingServicos, setLoadingServicos] = useState(true)

  useEffect(() => {
    if (!whatsapp) { setLoadingServicos(false); return }

    async function buscar() {
      setLoadingServicos(true)
      try {
        const data = await ClienteService.fetchClienteServicos(whatsapp)
        if (data) setServicos(
          data.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        )
      } finally {
        setLoadingServicos(false)
      }
    }

    buscar()
  }, [whatsapp])

  const getStatusInfo = (servico: any) => {
    const s = servico?.status?.toLowerCase()
    const temFoto3  = servico?.portfolio_fotos?.some((f: any) => f.ordem === 3)
    const jaAvaliado = servico?.avaliacoes?.length > 0

    if (s === 'pendente')
      return { label: 'Aguardando aceite', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', urgente: false }
    if (s === 'em_execucao' && temFoto3)
      return { label: 'Avaliar agora', dot: 'bg-blue-500', badge: 'bg-blue-600 text-white border-blue-600', urgente: true }
    if (s === 'em_execucao')
      return { label: 'Em andamento', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700 border-blue-200', urgente: false }
    if ((s === 'finalizado' || s === 'concluido') && jaAvaliado)
      return { label: 'Concluído', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 border-green-200', urgente: false }
    if (s === 'finalizado' || s === 'concluido')
      return { label: 'Finalizado', dot: 'bg-green-400', badge: 'bg-green-50 text-green-700 border-green-200', urgente: false }
    return { label: s, dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border-slate-200', urgente: false }
  }

  const getRotaDestino = (s: any) => {
    const temFoto3 = s.portfolio_fotos?.some((f: any) => f.ordem === 3)
    if (s.status === 'pendente') return `/meus-servicos?token=${s.avaliacao_token}`
    if (s.status === 'em_execucao' && !temFoto3) return `/acompanhamento/${s.avaliacao_token}`
    if (s.status === 'em_execucao' && temFoto3)  return `/avaliar/${s.avaliacao_token}`
    return `/avaliar/${s.avaliacao_token}`
  }

  const servicosFiltrados = servicos.filter(s => {
    const st = s.status?.toLowerCase()
    const temFoto3 = s.portfolio_fotos?.some((f: any) => f.ordem === 3)
    if (filtroStatus === 'todos')       return true
    if (filtroStatus === 'pendente')    return st === 'pendente'
    if (filtroStatus === 'andamento')   return st === 'em_execucao' && !temFoto3
    if (filtroStatus === 'avaliar')     return st === 'em_execucao' && temFoto3
    if (filtroStatus === 'finalizados') return st === 'finalizado' || st === 'concluido'
    return true
  })

  const avaliarCount = servicos.filter(s =>
    s.status === 'em_execucao' && s.portfolio_fotos?.some((f: any) => f.ordem === 3)
  ).length

  const ativosCount = servicos.filter(s =>
    s.status === 'pendente' || s.status === 'em_execucao'
  ).length

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
    filtroStatus, setFiltroStatus,
    loadingServicos,
    servicosFiltrados,
    avaliarCount,
    ativosCount,
    getStatusInfo,
    getRotaDestino,
    irParaAvaliar,
  }
}
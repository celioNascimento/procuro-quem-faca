//hooks/usePortfolioDashboard.ts

'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Prestador } from '@/types/prestador'
import {
  getPrestadorPerfilDoUsuario,
  getProjetosPorPrestador,
  getProjetoAtualizado,
} from '@/lib/services/portfolioDashboard.service'

export type Foto = {
  id: string
  url_foto: string
  ordem: number
}

export type Projeto = {
  id: string
  titulo: string
  status: string
  created_at: string
  prestador_id: number
  cliente_nome: string | null
  cliente_whatsapp: string
  portfolio_fotos: Foto[]
  avaliacoes: { id: string }[]
  notifCount: number
}

export function usePortfolioDashboard() {
  const [projetos, setProjetos]               = useState<Projeto[]>([])
  const [loading, setLoading]                 = useState(true)
  const [meuPrestadorId, setMeuPrestadorId]   = useState<number | null>(null)
  const [perfilPrestador, setPerfilPrestador] = useState<Prestador | null>(null)
  const [showWizard, setShowWizard]           = useState(false)
  const [projetoParaEdicao, setProjetoParaEdicao] = useState<Projeto | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const prestador = await getPrestadorPerfilDoUsuario(user.id)
      if (!prestador) return

      setPerfilPrestador(prestador as unknown as Prestador)

      const prestadorIdNum = Number(prestador.id)
      setMeuPrestadorId(prestadorIdNum)

      const meusProjetos = await getProjetosPorPrestador(prestadorIdNum)
      setProjetos(meusProjetos.map(p => ({ ...p, notifCount: 0 })))
    } catch (err) {
      console.error('Erro dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  const abrirEdicao = async (projeto: Projeto) => {
    const atualizado = await getProjetoAtualizado(projeto.id)
    setProjetoParaEdicao(atualizado ?? projeto)
    setShowWizard(true)
  }

  const abrirNovo = () => {
    setProjetoParaEdicao(null)
    setShowWizard(true)
  }

  const fecharWizard = () => {
    setShowWizard(false)
    setProjetoParaEdicao(null)
    carregarDados()
  }

  const totalConcluidos = projetos.filter(
    p => p.status === 'finalizado' && p.avaliacoes?.length > 0
  ).length

  const totalAtivos = projetos.filter(
    p => ['pendente', 'em_execucao'].includes(p.status)
  ).length

  return {
    projetos,
    loading,
    meuPrestadorId,
    perfilPrestador,
    showWizard,
    projetoParaEdicao,
    totalConcluidos,
    totalAtivos,
    abrirEdicao,
    abrirNovo,
    fecharWizard,
  }
}
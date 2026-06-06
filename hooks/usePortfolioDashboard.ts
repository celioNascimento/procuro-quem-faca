'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  getPrestadorIdDoUsuario,
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
  portfolio_fotos: Foto[]
  avaliacoes: { id: string }[]
  notifCount: number
}

export function usePortfolioDashboard() {
  const [projetos, setProjetos]                   = useState<Projeto[]>([])
  const [loading, setLoading]                     = useState(true)
  const [meuPrestadorId, setMeuPrestadorId]       = useState<number | null>(null)
  const [showWizard, setShowWizard]               = useState(false)
  const [projetoParaEdicao, setProjetoParaEdicao] = useState<Projeto | null>(null)

  // ── Carregamento inicial ───────────────────────────────────────────────────
  const carregarDados = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const prestadorId = await getPrestadorIdDoUsuario(user.id)
      if (!prestadorId) return

      setMeuPrestadorId(prestadorId)

      const meusProjetos = await getProjetosPorPrestador(prestadorId)
      setProjetos(meusProjetos.map(p => ({ ...p, notifCount: 0 })))
    } catch (err) {
      console.error('Erro dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  // ── Ações ──────────────────────────────────────────────────────────────────

  // Busca o projeto fresco do banco antes de abrir edição — evita dados stale
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

  // ── Métricas derivadas ─────────────────────────────────────────────────────
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
    showWizard,
    projetoParaEdicao,
    totalConcluidos,
    totalAtivos,
    abrirEdicao,
    abrirNovo,
    fecharWizard,
  }
}
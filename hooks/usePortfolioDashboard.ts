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

export type GarantiaResumo = {
  id: string
  status: string
  origem: 'cliente' | 'prestador'
  // 'garantia' | 'reclamacao' — ver comentário em CasoGarantia
  // (hooks/useCasoGarantiaDoProjeto.ts) para o significado completo.
  tipo: 'garantia' | 'reclamacao'
  prazo_resposta: string | null
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
  // Join com solicitacoes_garantia — usado pelo ProjetoCard para exibir o
  // badge "Garantia acionada" quando há caso ativo. Array vazio = sem casos.
  solicitacoes_garantia: GarantiaResumo[]
  notifCount: number
  // Fluxo sem foto obrigatória — travado na criação do projeto a partir de
  // prestadores.portfolio_obrigatorio. Não muda retroativamente se o
  // prestador alterar a configuração depois de criar o projeto.
  sem_fotos: boolean
  // Preenchido quando o prestador marca o serviço como concluído no fluxo
  // sem_fotos (equivalente à foto 3 + legenda no fluxo com fotos).
  marcado_concluido_at: string | null
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

  const abrirEdicao = (projeto: Projeto) => {
    // Abre imediatamente com os dados já presentes no card; detalhes extras
    // são atualizados em segundo plano sem bloquear o toque.
    setProjetoParaEdicao(projeto)
    setShowWizard(true)

    void getProjetoAtualizado(projeto.id)
      .then((atualizado) => {
        if (atualizado) setProjetoParaEdicao(atualizado)
      })
      .catch((err) => {
        console.error('[v0] Erro ao atualizar projeto em segundo plano:', err)
      })
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

  // Casos de garantia ativos, agregados por todos os projetos —
  // usado para o alerta geral do dashboard (ex: badge no header/aba).
  const totalGarantiasAtivas = projetos.filter(p =>
    p.solicitacoes_garantia?.some(g =>
      ['aguardando_aceite_cliente', 'aberta', 'respondida'].includes(g.status),
    ),
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
    totalGarantiasAtivas,
    abrirEdicao,
    abrirNovo,
    fecharWizard,
  }
}

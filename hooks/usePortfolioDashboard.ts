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
import { ocultarProjetoNoFeed } from '@/lib/services/feed.service'
import { aplicarFeedOculto, mensagemDeResultado } from '@/lib/feed/feed'

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
  cliente_user_id: string | null
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
  // Feed de trabalhos (migração 20261119100000). Só o trabalho aceito depois do aviso e não retirado pelo
  // cliente é elegível; o prestador decide mostrar ou ocultar (feed_oculto).
  feed_aceito_em?: string | null
  feed_oculto?: boolean | null
  feed_revogado_em?: string | null
}

export function usePortfolioDashboard() {
  const [projetos, setProjetos]               = useState<Projeto[]>([])
  const [loading, setLoading]                 = useState(true)
  // Falha ao carregar não pode parecer "nenhum trabalho": a pessoa acharia que perdeu o que registrou.
  const [erro, setErro]                       = useState(false)
  const [meuPrestadorId, setMeuPrestadorId]   = useState<number | null>(null)
  const [perfilPrestador, setPerfilPrestador] = useState<Prestador | null>(null)
  const [showWizard, setShowWizard]           = useState(false)
  const [projetoParaEdicao, setProjetoParaEdicao] = useState<Projeto | null>(null)
  const [erroFeed, setErroFeed] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      setErro(false)
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
      setErro(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => carregarDados())
  }, [carregarDados])

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
        console.error('Erro ao atualizar projeto em segundo plano:', err)
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

  // Mostrar/ocultar no feed: muda na hora e volta se o banco recusar.
  const alternarFeed = useCallback(async (projetoId: string) => {
    const atual = projetos.find(p => p.id === projetoId)
    if (!atual) return
    const ocultar = !atual.feed_oculto
    setErroFeed(null)
    setProjetos(lista => aplicarFeedOculto(lista, projetoId, ocultar))
    try {
      const codigo = await ocultarProjetoNoFeed(projetoId, ocultar)
      const msg = mensagemDeResultado(codigo)
      if (msg) throw new Error(msg)
    } catch (e) {
      console.error('Erro ao mostrar/ocultar no feed:', e)
      setProjetos(lista => aplicarFeedOculto(lista, projetoId, !ocultar))
      setErroFeed(e instanceof Error && e.message ? e.message : 'Não conseguimos alterar agora. Tente de novo.')
    }
  }, [projetos])

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
    erro,
    erroFeed,
    alternarFeed,
    recarregar: carregarDados,
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

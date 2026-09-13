//hooks/usePainelCliente.ts

'use client'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Servico } from '@/types/painel'
import { updateClienteProfile } from '@/lib/services/cliente.service'
import {
  getProfile,
  getServicoPorToken,
  getServicosPorUserId,
  getServicosPorWhatsapp,
  filtrarComGarantiaAtiva,
  filtrarComReclamacaoAtiva,
  aceitarServico,
} from '../lib/services/painelCliente.service'

export function usePainelCliente() {
  const router = useRouter()
  const [session, setSession]     = useState<Session | null>(null)
  type ClienteProfile = Awaited<ReturnType<typeof getProfile>>
  const [profile, setProfile]     = useState<ClienteProfile>(null)
  const [servicos, setServicos]   = useState<Servico[]>([])
  const [loading, setLoading]     = useState(true)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const userCarregadoRef = useRef<string | null>(null)
  const tokenUrl = useMemo(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('token')
  }, [])

  // Derivados diretamente de servicos (que já traz solicitacoes_garantia
  // embutido via join) — não são estado próprio nem consulta separada.
  // Elimina o risco de dessincronia entre arrays de origens diferentes.
  // Separados por tipo: garantia formal e reclamação viram filtros
  // distintos na UI, mesmo usando a mesma máquina de estados por baixo.
  const servicosGarantia = filtrarComGarantiaAtiva(servicos)
  const servicosReclamacao = filtrarComReclamacaoAtiva(servicos)

  // Confirmação de whatsapp antes do aceite — só é acionado quando
  // profile.whatsapp ainda não bate com o cliente_whatsapp do projeto
  // (ver policy portfolio_projetos_cliente_aceita_proprio). Guarda o
  // serviço pendente de confirmação para retomar o aceite depois.
  const [confirmandoWhatsapp, setConfirmandoWhatsapp] = useState<Servico | null>(null)
  const [confirmandoErro, setConfirmandoErro] = useState<string | null>(null)

  const buscarDados = useCallback(async (
    user: { id: string },
    token: string | null,
  ) => {
    setLoading(true)
    try {
      // Perfil e consulta principal são independentes: iniciá-los juntos
      // evita que o painel aguarde o perfil antes de buscar os serviços.
      const [prof, projetosIniciais, projetosDoCliente] = await Promise.all([
        getProfile(user.id),
        token ? getServicoPorToken(token) : getServicosPorUserId(user.id),
        token ? getServicosPorUserId(user.id) : Promise.resolve([] as Servico[]),
      ])
      setProfile(prof)

      let projs: Servico[] = projetosIniciais

      // Ao abrir um projeto pelo perfil, traz também os demais projetos do
      // mesmo prestador para que o cliente tenha contexto sem misturar
      // serviços de profissionais diferentes.
      if (token && projetosIniciais[0]) {
        const prestadorId = projetosIniciais[0].prestadores?.id
        projs = projetosDoCliente.filter(projeto =>
          projeto.id === projetosIniciais[0].id ||
          (prestadorId != null && projeto.prestadores?.id === prestadorId),
        )
      }

      // Com token, tenta o vínculo forte caso o token não retorne projetos.
      if (projs.length === 0 && token) {
        projs = projetosDoCliente
      }

      // Fallback para projetos antigos sem cliente_user_id.
      if (projs.length === 0) {
        const whatsapp = prof?.whatsapp || localStorage.getItem('cliente_whatsapp')
        if (whatsapp) projs = await getServicosPorWhatsapp(whatsapp)
      }

      // 4. FILTRO ANTI-ESPELHO: Remove projetos onde o usuário atual é o PRESTADOR
      if (projs.length > 0) {
        projs = projs.filter(p => p.prestadores?.user_id !== user.id)
      }

      if (projs.length > 0) {
        setServicos(projs)
      } else {
        router.push('/painel/perfil')
        return
      }
    } catch {
      router.push('/painel/perfil')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    let cancelado = false


    const resolverSessao = (session: Session | null) => {
      if (cancelado) return
      setSession(session)
      if (session) {
        userCarregadoRef.current = session.user.id
        void buscarDados(session.user, tokenUrl)
      } else {
        setLoading(false)
      }
    }

    void supabase.auth.getSession()
      .then(({ data: { session } }) => resolverSessao(session))
      .catch(() => {
        // A navegação entre rotas não pode deixar o skeleton preso caso a
        // leitura da sessão falhe; o listener continuará capaz de recuperar
        // a sessão quando o Supabase emitir o próximo evento.
        if (!cancelado) {
          setSession(null)
          setLoading(false)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (!session) {
          userCarregadoRef.current = null
          setLoading(false)
          return
        }
        if (userCarregadoRef.current === session.user.id) return
        userCarregadoRef.current = session.user.id
        buscarDados(session.user, tokenUrl)
      }
    )

    return () => {
      cancelado = true
      subscription.unsubscribe()
    }
  }, [tokenUrl, buscarDados])

  const handleAceitar = async (servico: Servico) => {
    const whatsappProjeto = servico.cliente_whatsapp?.replace(/\D/g, '') ?? ''
    const whatsappPerfil = profile?.whatsapp?.replace(/\D/g, '') ?? ''

    // Se o whatsapp do perfil ainda não bate com o do projeto, a policy de
    // update bloquearia o aceite silenciosamente (RLS nega, sem mensagem
    // clara). Em vez de deixar isso falhar, intercepta aqui e pede
    // confirmação explícita do número antes de prosseguir.
    if (whatsappProjeto && whatsappPerfil !== whatsappProjeto) {
      setConfirmandoWhatsapp(servico)
      return
    }

    await executarAceite(servico)
  }

  const executarAceite = async (servico: Servico) => {
    const nome =
      profile?.full_name ||
      session?.user?.user_metadata?.full_name ||
      servico.cliente_nome

    await aceitarServico(servico.id, nome, session?.user?.id)

    setServicos(prev =>
      prev.map(s =>
        s.id === servico.id
          ? { ...s, status: 'em_execucao', aceito_at: new Date().toISOString() }
          : s
      )
    )

    router.push(`/acompanhamento/${servico.avaliacao_token}`)
  }

  /**
   * Confirma (ou edita) o whatsapp do cliente e, se bem-sucedido, retoma o
   * aceite do serviço que ficou pendente de confirmação. numeroConfirmado
   * é o valor final digitado pelo cliente — pode ser igual ao do projeto
   * (confirmação simples) ou diferente (edição).
   */
  const confirmarWhatsappEAceitar = async (numeroConfirmado: string) => {
    if (!confirmandoWhatsapp || !session?.user?.id) return
    setConfirmandoErro(null)
    try {
      await updateClienteProfile(session.user.id, { whatsapp: numeroConfirmado.replace(/\D/g, '') })
      setProfile((prev) => (prev ? { ...prev, whatsapp: numeroConfirmado } : prev))

      const servico = confirmandoWhatsapp
      setConfirmandoWhatsapp(null)
      await executarAceite(servico)
    } catch (err) {
      console.error('Erro ao confirmar whatsapp:', err)
      setConfirmandoErro('Não foi possível salvar. Tente novamente.')
    }
  }

  const cancelarConfirmacaoWhatsapp = () => {
    setConfirmandoWhatsapp(null)
    setConfirmandoErro(null)
  }

  // Navega para a mesma tela de acompanhamento, sinalizando a seção de
  // garantia/reclamação — a própria seção decide qual dos dois exibir
  // com base no tipo do caso, então não precisa de rota diferente aqui.
  const handleVerGarantia = (servico: Servico) => {
    router.push(`/acompanhamento/${servico.avaliacao_token}?garantia=1`)
  }

  const nomeCliente =
    profile?.full_name || session?.user?.user_metadata?.full_name || ''
  const avatarUrl =
    profile?.avatar_url || session?.user?.user_metadata?.avatar_url

  return {
    session, profile, servicos, servicosGarantia, servicosReclamacao, loading,
    zoomImage, setZoomImage,
    tokenUrl, nomeCliente, avatarUrl,
    handleAceitar, handleVerGarantia,
    confirmandoWhatsapp, confirmandoErro,
    confirmarWhatsappEAceitar, cancelarConfirmacaoWhatsapp,
  }
}

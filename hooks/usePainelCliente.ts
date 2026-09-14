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
  recusarServico,
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

  const servicosGarantia = filtrarComGarantiaAtiva(servicos)
  const servicosReclamacao = filtrarComReclamacaoAtiva(servicos)

  const [confirmandoWhatsapp, setConfirmandoWhatsapp] = useState<Servico | null>(null)
  const [confirmandoErro, setConfirmandoErro] = useState<string | null>(null)

  const buscarDados = useCallback(async (
    user: { id: string },
    token: string | null,
  ) => {
    setLoading(true)
    setServicos([])
    try {
      const [prof, projetosIniciais, projetosDoCliente] = await Promise.all([
        getProfile(user.id),
        token ? getServicoPorToken(token) : getServicosPorUserId(user.id),
        token ? getServicosPorUserId(user.id) : Promise.resolve([] as Servico[]),
      ])
      setProfile(prof)

      let projs: Servico[] = projetosIniciais

      if (token && projetosIniciais[0]) {
        const prestadorId = projetosIniciais[0].prestadores?.id
        projs = projetosDoCliente.filter(projeto =>
          projeto.id === projetosIniciais[0].id ||
          (prestadorId != null && projeto.prestadores?.id === prestadorId),
        )

        // Serviços pendentes têm cliente_user_id null — não aparecem em
        // projetosDoCliente (que filtra por cliente_user_id). Garante que
        // o projeto aberto pelo token sempre esteja na lista, mesmo sem
        // vínculo formal ainda.
        if (!projs.some(p => p.id === projetosIniciais[0].id)) {
          projs = [projetosIniciais[0], ...projs]
        }
      }

      if (projs.length === 0 && token) {
        projs = projetosDoCliente
      }

      if (projs.length === 0) {
        const whatsapp = prof?.whatsapp || localStorage.getItem('cliente_whatsapp')
        if (whatsapp) projs = await getServicosPorWhatsapp(whatsapp)
      }

      if (projs.length > 0) {
        projs = projs.filter(p =>
          token && p.avaliacao_token === token
            ? true
            : p.prestadores?.user_id !== user.id,
        )
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

    if (whatsappProjeto && whatsappPerfil !== whatsappProjeto) {
      setConfirmandoWhatsapp(servico)
      return
    }

    await executarAceite(servico)
  }

  const handleRecusar = async (servico: Servico) => {
    await recusarServico(servico.id)
    setServicos(prev => prev.filter(s => s.id !== servico.id))
  }

  const executarAceite = async (servico: Servico) => {
    const nome =
      profile?.full_name ||
      session?.user?.user_metadata?.full_name ||
      servico.cliente_nome

    await aceitarServico(servico.id, nome, session?.user?.id)

    router.push(`/acompanhamento/${servico.avaliacao_token}`)
  }

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
    handleAceitar, handleRecusar, handleVerGarantia,
    confirmandoWhatsapp, confirmandoErro,
    confirmarWhatsappEAceitar, cancelarConfirmacaoWhatsapp,
  }
}

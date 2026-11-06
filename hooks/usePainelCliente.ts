//hooks/usePainelCliente.ts

'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Servico } from '@/types/painel'
import {
  getProfile,
  getServicoPorToken,
  getServicosPorUserId,
  filtrarComGarantiaAtiva,
  filtrarComReclamacaoAtiva,
  aceitarServico,
  recusarServico,
} from '../lib/services/painelCliente.service'

export function usePainelCliente() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const tokenUrl     = searchParams.get('token')

  const [session, setSession]   = useState<Session | null>(null)
  type ClienteProfile = Awaited<ReturnType<typeof getProfile>>
  const [profile, setProfile]   = useState<ClienteProfile>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading]   = useState(true)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  // Rastreia qual user já foi carregado para evitar re-fetch desnecessário
  // quando onAuthStateChange dispara após getSession já ter resolvido.
  const [userCarregadoId, setUserCarregadoId] = useState<string | null>(null)

  const servicosGarantia   = filtrarComGarantiaAtiva(servicos)
  const servicosReclamacao = filtrarComReclamacaoAtiva(servicos)

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
        setUserCarregadoId(session.user.id)
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
          setUserCarregadoId(null)
          setLoading(false)
          return
        }
        if (userCarregadoId === session.user.id) return
        setUserCarregadoId(session.user.id)
        buscarDados(session.user, tokenUrl)
      }
    )

    return () => {
      cancelado = true
      subscription.unsubscribe()
    }
  // tokenUrl agora vem de useSearchParams e é reativo — re-executa
  // buscarDados quando a URL muda (ex: navegação client-side com token novo).
  }, [tokenUrl, buscarDados, userCarregadoId])

  // Só a conta dona do projeto (vinculada ao abrir o link com o token) aceita; a regra
  // é imposta pela função aceitar_projeto no banco.
  const handleAceitar = async (servico: Servico) => {
    const nome =
      profile?.full_name ||
      session?.user?.user_metadata?.full_name ||
      servico.cliente_nome

    await aceitarServico(servico.id, nome)

    router.push(`/acompanhamento/${servico.avaliacao_token}`)
  }

  const handleRecusar = async (servico: Servico) => {
    await recusarServico(servico.id)
    setServicos(prev => prev.filter(s => s.id !== servico.id))
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
  }
}

//hooks/usePainelCliente.ts

'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Servico } from '@/types/painel'
import {
  getProfile,
  getServicoPorToken,
  getServicosPorUserId,
  getServicosPorWhatsapp,
  aceitarServico,
} from '../lib/services/painelCliente.service'

export function usePainelCliente() {
  const router = useRouter()
  const [session, setSession]     = useState<Session | null>(null)
  const [profile, setProfile]     = useState<any>(null)
  const [servicos, setServicos]   = useState<Servico[]>([])
  const [loading, setLoading]     = useState(true)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [tokenUrl, setTokenUrl]   = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setTokenUrl(params.get('token'))
  }, [])

  const buscarDados = useCallback(async (
    user: { id: string },
    token: string | null,
  ) => {
    setLoading(true)
    try {
      const prof = await getProfile(user.id)
      setProfile(prof)

      let projs: Servico[] = []

      // 1. Tenta buscar pelo token da URL primeiro
      if (token) {
        projs = await getServicoPorToken(token)
      }

      // 2. Tenta buscar pelo ID Forte (nova coluna cliente_user_id)
      if (projs.length === 0) {
        projs = await getServicosPorUserId(user.id)
      }

      // 3. Fallback: busca pelo whatsapp (para projetos antigos sem cliente_user_id)
      if (projs.length === 0) {
        const whatsapp = prof?.whatsapp || localStorage.getItem('cliente_whatsapp')
        if (whatsapp) projs = await getServicosPorWhatsapp(whatsapp)
      }

      // 4. FILTRO ANTI-ESPELHO: Remove projetos onde o usuário atual é o PRESTADOR
      if (projs.length > 0) {
        projs = projs.filter(p => p.prestadores?.user_id !== user.id)
      }

      if (projs.length > 0) setServicos(projs)
      else router.push('/painel/perfil')
    } catch {
      router.push('/painel/perfil')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (tokenUrl === null) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) buscarDados(session.user, tokenUrl)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) buscarDados(session.user, tokenUrl)
      }
    )

    return () => subscription.unsubscribe()
  }, [tokenUrl, buscarDados])

  const handleAceitar = async (servico: Servico) => {
    const nome =
      profile?.full_name ||
      session?.user?.user_metadata?.full_name ||
      servico.cliente_nome

    await aceitarServico(servico.id, nome)

    setServicos(prev =>
      prev.map(s =>
        s.id === servico.id
          ? { ...s, status: 'em_execucao', aceito_at: new Date().toISOString() }
          : s
      )
    )

    router.push(`/acompanhamento/${servico.avaliacao_token}`)
  }

  const nomeCliente =
    profile?.full_name || session?.user?.user_metadata?.full_name || ''
  const avatarUrl =
    profile?.avatar_url || session?.user?.user_metadata?.avatar_url

  return {
    session, profile, servicos, loading,
    zoomImage, setZoomImage,
    tokenUrl, nomeCliente, avatarUrl,
    handleAceitar,
  }
}

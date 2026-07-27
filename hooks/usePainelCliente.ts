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

  // Lê o token da URL uma única vez na montagem
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setTokenUrl(params.get('token'))
  }, [])

  // ✅ useCallback evita que buscarDados seja recriada a cada render,
  //    prevenindo loops infinitos no useEffect abaixo
  const buscarDados = useCallback(async (
    user: { id: string },
    token: string | null,
  ) => {
    setLoading(true)
    try {
      const prof = await getProfile(user.id)
      setProfile(prof)

      // Tenta buscar pelo token da URL primeiro
      let projs: Servico[] = token ? await getServicoPorToken(token) : []

      // Fallback: busca pelo whatsapp do perfil ou do localStorage
      if (projs.length === 0) {
        const whatsapp = prof?.whatsapp || localStorage.getItem('cliente_whatsapp')
        if (whatsapp) projs = await getServicosPorWhatsapp(whatsapp)
      }

      if (projs.length > 0) setServicos(projs)
      else router.push('/painel/perfil')
    } catch {
      router.push('/painel/perfil')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Inicializa sessão e assina mudanças de auth
  useEffect(() => {
    // Aguarda tokenUrl ser lido (pode ser null legítimo ou ainda não inicializado)
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

  // ✅ Atualiza o banco, espelha no estado local e navega via router (sem hard reload)
  const handleAceitar = async (servico: Servico) => {
    const nome =
      profile?.full_name ||
      session?.user?.user_metadata?.full_name ||
      servico.cliente_nome

    // ✅ Apenas 2 argumentos — alinhado com a assinatura do service
    await aceitarServico(servico.id, nome)

    // Atualiza o card localmente antes de navegar (feedback imediato)
    setServicos(prev =>
      prev.map(s =>
        s.id === servico.id
          ? { ...s, status: 'em_execucao', aceito_at: new Date().toISOString() }
          : s
      )
    )

    // Navegação client-side — muito mais rápida que window.location.href
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
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Servico } from '@/types/painel'
import {
  getProfile, getServicoPorToken, getServicosPorWhatsapp, aceitarServico
} from '../lib/services/painelCliente.service'

export function usePainelCliente() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [tokenUrl, setTokenUrl] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setTokenUrl(params.get('token'))
  }, [])

  const buscarDados = async (user: { id: string }, token: string | null) => {
    setLoading(true)
    try {
      const prof = await getProfile(user.id)
      setProfile(prof)

      let projs: Servico[] = token ? await getServicoPorToken(token) : []

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
  }

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
  }, [tokenUrl])

  const handleAceitar = async (servico: Servico) => {
    const nome =
      profile?.full_name ||
      session?.user?.user_metadata?.full_name ||
      servico.cliente_nome
    await aceitarServico(servico.id, nome, servico.avaliacao_token)
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
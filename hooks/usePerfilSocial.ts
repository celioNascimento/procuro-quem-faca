// hooks/usePerfilSocial.ts — curtir e seguir no perfil público (otimista, com volta em caso de erro).
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/hooks/useSession'
import { alternarCurtida, deixarDeSeguirPrestador, fetchPerfilSocial, seguirPrestador } from '@/lib/services/feed.service'
import { MENSAGEM_LOGIN_PARA_AGIR, mensagemDeResultado } from '@/lib/feed/feed'
import { aplicarCurtidaNoPerfil, aplicarSeguirNoPerfil, type PerfilSocial } from '@/lib/feed/perfilSocial'

export function usePerfilSocial(prestadorId: number) {
  const session = useSession()
  const logado = !!session
  const [social, setSocial] = useState<PerfilSocial | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  // Recarrega quando a sessão muda: "seguindo" e "curtido" dependem de quem está olhando.
  useEffect(() => {
    let cancelado = false
    fetchPerfilSocial(prestadorId)
      .then(s => { if (!cancelado) setSocial(s) })
      .catch(e => { console.error('Erro ao carregar curtir/seguir do perfil:', e); if (!cancelado) setSocial(null) })
    return () => { cancelado = true }
  }, [prestadorId, logado])

  const seguir = useCallback(async () => {
    if (!social) return
    if (!logado) { setAviso(MENSAGEM_LOGIN_PARA_AGIR); return }
    setAviso(null)
    const antes = social
    setSocial(aplicarSeguirNoPerfil(social, !social.seguindo))
    try {
      const codigo = antes.seguindo ? await deixarDeSeguirPrestador(prestadorId) : await seguirPrestador(prestadorId)
      const msg = mensagemDeResultado(codigo)
      if (msg) throw new Error(msg)
    } catch (e) {
      setSocial(atual => (atual ? { ...atual, seguindo: antes.seguindo, totalSeguidores: antes.totalSeguidores } : atual))
      setAviso(e instanceof Error ? e.message : 'Não conseguimos concluir agora. Tente de novo.')
    }
  }, [social, logado, prestadorId])

  const curtir = useCallback(async (projetoId: string) => {
    if (!social) return
    if (!logado) { setAviso(MENSAGEM_LOGIN_PARA_AGIR); return }
    setAviso(null)
    const antes = social.curtidas[projetoId] ?? { total: 0, curtidoPorMim: false }
    setSocial(s => (s ? aplicarCurtidaNoPerfil(s, projetoId, !antes.curtidoPorMim, antes.total + (antes.curtidoPorMim ? -1 : 1)) : s))
    try {
      const r = await alternarCurtida(projetoId)
      const msg = mensagemDeResultado(r.erro)
      if (msg || r.curtido === undefined) throw new Error(msg ?? 'resposta inesperada')
      setSocial(s => (s ? aplicarCurtidaNoPerfil(s, projetoId, r.curtido as boolean, r.total ?? 0) : s))
    } catch (e) {
      setSocial(s => (s ? aplicarCurtidaNoPerfil(s, projetoId, antes.curtidoPorMim, antes.total) : s))
      setAviso(e instanceof Error && e.message !== 'resposta inesperada' ? e.message : 'Não conseguimos curtir agora. Tente de novo.')
    }
  }, [social, logado])

  return { social, logado, aviso, seguir, curtir, limparAviso: () => setAviso(null) }
}

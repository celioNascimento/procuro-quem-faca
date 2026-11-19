// hooks/useFeed.ts — estado do feed: filtros, páginas, curtir e seguir (otimista, com volta em caso de erro).
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { alternarCurtida, deixarDeSeguirPrestador, fetchFeed, seguirPrestador } from '@/lib/services/feed.service'
import type { FiltrosFeed } from '@/lib/feed/filtros'
import {
  aplicarCurtida, aplicarSeguir, ITENS_POR_PAGINA, MENSAGEM_LOGIN_PARA_AGIR, mensagemDeResultado, type FeedItem,
} from '@/lib/feed/feed'

export type AbaFeed = 'todos' | 'seguindo'

// Tipo de serviço e cidade vêm de fora (do endereço da página); a aba e o resto ficam aqui.
export function useFeed(logado: boolean, { categoriaId, cidadeId }: FiltrosFeed = { categoriaId: null, cidadeId: null }) {
  const [aba, setAba] = useState<AbaFeed>('todos')
  const [itens, setItens] = useState<FeedItem[]>([])
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const requisicao = useRef(0)

  const carregar = useCallback(async (paginaAlvo: number, acumular: boolean) => {
    const minha = ++requisicao.current
    setCarregando(true)
    try {
      const novos = await fetchFeed({ categoriaId, cidadeId, somenteSeguidos: aba === 'seguindo', pagina: paginaAlvo })
      if (minha !== requisicao.current) return
      setItens(atual => (acumular ? [...atual, ...novos.filter(n => !atual.some(a => a.projetoId === n.projetoId))] : novos))
      setPagina(paginaAlvo)
      setTemMais(novos.length >= ITENS_POR_PAGINA)
      setErro(null)
    } catch (e) {
      if (minha !== requisicao.current) return
      console.error('Erro ao carregar o feed:', e)
      setErro('Não foi possível carregar o feed agora. Confira sua internet e tente de novo.')
    } finally {
      if (minha === requisicao.current) setCarregando(false)
    }
  }, [categoriaId, cidadeId, aba])

  useEffect(() => { queueMicrotask(() => carregar(0, false)) }, [carregar])

  const carregarMais = useCallback(() => carregar(pagina + 1, true), [carregar, pagina])

  const curtir = useCallback(async (projetoId: string) => {
    if (!logado) { setAviso(MENSAGEM_LOGIN_PARA_AGIR); return }
    setAviso(null)
    const antes = itens.find(i => i.projetoId === projetoId)
    if (!antes) return
    setItens(a => aplicarCurtida(a, projetoId, !antes.curtidoPorMim, Math.max(0, antes.totalCurtidas + (antes.curtidoPorMim ? -1 : 1))))
    try {
      const r = await alternarCurtida(projetoId)
      const msg = mensagemDeResultado(r.erro)
      if (msg || r.curtido === undefined) throw new Error(msg ?? 'resposta inesperada')
      setItens(a => aplicarCurtida(a, projetoId, r.curtido as boolean, r.total ?? 0))
    } catch (e) {
      setItens(a => aplicarCurtida(a, projetoId, antes.curtidoPorMim, antes.totalCurtidas))
      setAviso(e instanceof Error && e.message !== 'resposta inesperada' ? e.message : 'Não conseguimos curtir agora. Tente de novo.')
    }
  }, [itens, logado])

  const alternarSeguir = useCallback(async (prestadorId: number) => {
    if (!logado) { setAviso(MENSAGEM_LOGIN_PARA_AGIR); return }
    setAviso(null)
    const antes = itens.find(i => i.prestador.id === prestadorId)?.seguindo ?? false
    setItens(a => aplicarSeguir(a, prestadorId, !antes))
    try {
      const codigo = antes ? await deixarDeSeguirPrestador(prestadorId) : await seguirPrestador(prestadorId)
      const msg = mensagemDeResultado(codigo)
      if (msg) throw new Error(msg)
      // Na aba "Quem eu sigo", deixar de seguir tira o trabalho da lista.
      if (antes && aba === 'seguindo') setItens(a => a.filter(i => i.prestador.id !== prestadorId))
    } catch (e) {
      setItens(a => aplicarSeguir(a, prestadorId, antes))
      setAviso(e instanceof Error ? e.message : 'Não conseguimos concluir agora. Tente de novo.')
    }
  }, [itens, logado, aba])

  return { aba, setAba, itens, temMais, carregando, erro, aviso, carregarMais, curtir, alternarSeguir, recarregar: () => carregar(0, false) }
}

//hooks/usePerfilPrestador.ts

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { insertLog } from '@/lib/db/logs'
import type { PerfilData, ProjetoPerfil, FotoProjeto } from '@/types/perfil'

interface UsePerfilPrestadorReturn {
  data: PerfilData | null
  loading: boolean
  erro: boolean
}

function normalizarArray<T>(raw: T | T[] | null | undefined): T[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'object') return [raw as T]
  return []
}

export function usePerfilPrestador(): UsePerfilPrestadorReturn {
  const params       = useParams()
  const searchParams = useSearchParams()

  const [data, setData]       = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    async function carregar() {
      const slug = params?.slug as string | undefined
      if (!slug) { setLoading(false); return }

      setLoading(true)
      setErro(false)
      setData(null)

      try {
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(slug)

        let query = supabase
          .from('prestadores')
          .select(`
            *,
            cidades(nome, estado_sigla),
            categorias(nome),
            portfolio_projetos(
              id, titulo, descricao, status, created_at,
              portfolio_fotos(id, url_foto, ordem, legenda),
              avaliacoes(id, indica)
            )
          `)
          .abortSignal(controller.signal)

        query = isUUID ? query.eq('id', slug) : query.eq('slug', slug)

        const { data: prestadorRaw, error: prestadorError } = await query.single()
        if (prestadorError) throw prestadorError

        const { data: avaliacoesRaw, error: avalError } = await supabase
          .from('avaliacoes')
          .select('id, nota, comentario, indica, created_at')
          .eq('prestador_id', prestadorRaw.id)
          .eq('visivel', true)
          .order('created_at', { ascending: false })
          .limit(10)
          .abortSignal(controller.signal)

        if (avalError) throw avalError

        const projetos: ProjetoPerfil[] = normalizarArray(prestadorRaw.portfolio_projetos)
          .filter(p => ['em_execucao', 'finalizado'].includes(p.status))
          .map(p => ({
            ...p,
            portfolio_fotos: normalizarArray<FotoProjeto>(p.portfolio_fotos)
              .filter(f => Boolean(f?.url_foto)),
            avaliacoes: normalizarArray<{ id: string; indica: boolean }>(p.avaliacoes),
          }))
          .sort((a, b) => {
            if (a.status === b.status)
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return a.status === 'finalizado' ? -1 : 1
          })

        // ── Captura de origem (?from=) ──────────────────────────────
        // O parâmetro só serve pra reconstruir o botão "voltar" e pra
        // log de analytics. Ele NÃO deve permanecer visível na URL
        // pública/compartilhável, então é lido aqui, guardado em
        // memória (urlRetorno) e depois removido da barra de endereço.
        const fromParam = searchParams?.get('from')
        let urlRetorno = fromParam ? decodeURIComponent(fromParam) : '/prestadores'
        if (!fromParam) {
          const cat = prestadorRaw.categorias?.nome || prestadorRaw.categoria
          if (cat) urlRetorno = `/prestadores?q=${encodeURIComponent(cat)}`
        }

        if (fromParam) {
          // log de analytics: de onde o clique veio (sem depender da URL)
          insertLog({
            acao: 'VISITA_PERFIL_VIA_BUSCA',
            detalhes: { origem: urlRetorno },
            entidadeId: String(prestadorRaw.id),
          })

          // limpa a URL visível sem disparar navegação/refetch do Next
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('from')
            window.history.replaceState({}, '', url.pathname + url.search)
          }
        }

        setData({
          prestador: prestadorRaw,
          projetos,
          avaliacoes: avaliacoesRaw || [],
          urlRetorno,
        })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[usePerfilPrestador]', err)
        setErro(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    carregar()
    return () => controller.abort()
  }, [params?.slug])

  return { data, loading, erro }
}

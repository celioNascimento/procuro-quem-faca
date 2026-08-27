// hooks/usePerfilPrestador.ts

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { insertLog } from '@/lib/db/logs'
import { registrarVisitaPerfil } from '@/lib/db/visitasPerfil'
import type { PerfilData, ProjetoPerfil, FotoProjeto, GarantiaPublica, FotoGarantiaPublica } from '@/types/perfil'
import type { AvaliacaoPerfil } from '@/types/avaliacao'

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

const STATUS_GARANTIA_PUBLICA = ['resolvida', 'sem_resposta', 'recusada']

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
              solicitacoes_garantia(
                id, status, origem,
                descricao_problema, resposta_prestador_garantia,
                resolucao_descricao, nota_resultante,
                garantia_fotos(id, url_foto, ordem, legenda, fase, publica)
              )
            )
          `)
          .abortSignal(controller.signal)

        query = isUUID ? query.eq('id', slug) : query.eq('slug', slug)

        const { data: prestadorRaw, error: prestadorError } = await query.single()
        if (prestadorError) throw prestadorError

        const { data: avaliacoesRaw, error: avalError } = await supabase
          .from('avaliacoes')
          .select('id, nota, comentario, indica, created_at, projeto_id, cliente_nome, cliente_foto_url, portfolio_projetos(titulo)')
          .eq('prestador_id', prestadorRaw.id)
          .eq('visivel', true)
          .order('created_at', { ascending: false })
          .limit(10)
          .abortSignal(controller.signal)

        if (avalError) throw avalError

        const avaliacoes: AvaliacaoPerfil[] = (avaliacoesRaw ?? []).map(av => ({
          id:         av.id,
          comentario: av.comentario ?? null,
          indica:     av.indica,
          created_at: av.created_at,
          projeto_id: av.projeto_id ?? null,
          // Supabase retorna array no join — normalizamos para objeto | null
          portfolio_projetos: Array.isArray(av.portfolio_projetos)
            ? (av.portfolio_projetos[0] ?? null)
            : (av.portfolio_projetos ?? null),
          cliente_nome:     av.cliente_nome ?? null,
          cliente_foto_url: av.cliente_foto_url ?? null,
        }))

        const projetos: ProjetoPerfil[] = normalizarArray(prestadorRaw.portfolio_projetos)
          .filter(p => ['em_execucao', 'finalizado'].includes(p.status))
          .map(p => ({
            ...p,
            portfolio_fotos: normalizarArray<FotoProjeto>(p.portfolio_fotos)
              .filter(f => Boolean(f?.url_foto)),
            avaliacoes: avaliacoes
              .filter(av => av.projeto_id === p.id)
              .map(av => ({
                id:         av.id,
                indica:     av.indica ?? false,
                comentario: av.comentario ?? null,
              })),
            solicitacoes_garantia: normalizarArray<any>(p.solicitacoes_garantia)
              .filter(g => STATUS_GARANTIA_PUBLICA.includes(g.status))
              .map(g => ({
                id:                          g.id,
                status:                      g.status,
                origem:                      g.origem,
                descricao_problema:          g.descricao_problema,
                resposta_prestador_garantia: g.resposta_prestador_garantia ?? null,
                resolucao_descricao:         g.resolucao_descricao ?? null,
                nota_resultante:             g.nota_resultante ?? null,
                // Apenas fotos de resolução marcadas como públicas
                fotos: normalizarArray<FotoGarantiaPublica>(g.garantia_fotos)
                  .filter(f => f.fase === 'resolucao' && f.publica === true),
              })) as GarantiaPublica[],
          }))
          .sort((a, b) => {
            if (a.status === b.status)
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            return a.status === 'finalizado' ? -1 : 1
          })

        const fromParam = searchParams?.get('from')
        let urlRetorno = fromParam ? decodeURIComponent(fromParam) : '/prestadores'
        if (!fromParam) {
          const cat = prestadorRaw.categorias?.nome || prestadorRaw.categoria
          if (cat) urlRetorno = `/prestadores?q=${encodeURIComponent(cat)}`
        }

        if (fromParam) {
          insertLog({
            acao: 'VISITA_PERFIL_VIA_BUSCA',
            detalhes: { origem: urlRetorno },
            entidadeId: String(prestadorRaw.id),
          })

          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('from')
            window.history.replaceState({}, '', url.pathname + url.search)
          }
        }

        // Fire-and-forget — não bloqueia a renderização
        registrarVisitaPerfil(prestadorRaw.id)

        setData({
          prestador: prestadorRaw,
          projetos,
          avaliacoes,
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
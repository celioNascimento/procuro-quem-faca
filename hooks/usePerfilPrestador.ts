// hooks/usePerfilPrestador.ts

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { insertLog } from '@/lib/db/logs'
import { registrarVisitaPerfil } from '@/lib/db/visitasPerfil'
import { sanitizarRotaInterna } from '@/lib/navegacao'
import type { PerfilData, PrestadorPerfil, ProjetoPerfil, FotoProjeto, GarantiaPublica, FotoGarantiaPublica } from '@/types/perfil'
import type { AvaliacaoPerfil } from '@/types/avaliacao'
import { tituloDaVitrine } from '@/lib/vitrine/vitrine'

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

// Colunas públicas de `prestadores` (nada de user_id, cliques, motivo de bloqueio, ativação).
const COLUNAS_PRESTADOR_PUBLICO = [
  'id', 'created_at', 'nome', 'bio', 'whatsapp', 'foto_perfil', 'bairro', 'status', 'aprovado_em',
  'bloqueado', 'habilidades', 'tags', 'estado_sigla', 'cidade_id', 'regiao_id', 'slug',
  'cidades_atendidas', 'origem_tipo', 'verificado', 'grupo_id', 'categoria_id', 'garantia_dias',
  'portfolio_obrigatorio', 'sessao_fotos_titulo', 'sessao_fotos_urls',
].join(', ')

type ProjetoRaw = {
  id: string
  titulo: string
  descricao?: string | null
  status: string
  created_at: string
  sem_fotos: boolean | null
  portfolio_fotos: FotoProjeto | FotoProjeto[] | null
  solicitacoes_garantia: GarantiaRaw | GarantiaRaw[] | null
}

type PrestadorRaw = Omit<PrestadorPerfil, 'portfolio_projetos'> & {
  portfolio_projetos: ProjetoRaw | ProjetoRaw[] | null
  sessao_fotos_titulo?: string | null
  sessao_fotos_urls?: string[] | null
}

const STATUS_GARANTIA_PUBLICA = ['resolvida', 'sem_resposta', 'recusada']

type GarantiaRaw = {
  id: string
  status: string
  origem: string | null
  descricao_problema: string | null
  resposta_prestador_garantia: string | null
  resolucao_descricao: string | null
  nota_resultante: number | null
  garantia_fotos: FotoGarantiaPublica[] | FotoGarantiaPublica[] | null
}

export function usePerfilPrestador(): UsePerfilPrestadorReturn {
  const params       = useParams()
  const slug = params?.slug as string | undefined

  const [data, setData]       = useState<PerfilData | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro]       = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    // `from` é lido uma única vez por perfil. Antes ele vinha de useSearchParams e era
    // apagado da URL logo após o carregamento: isso mudava a dependência do efeito,
    // recarregava o perfil e trocava a URL de retorno pela da categoria.
    const fromParam = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('from')
      : null

    async function carregar() {
      if (!slug) { setLoading(false); return }

      // Mantém o perfil atual durante revalidações para evitar o piscar da tela.
      setErro(false)

      try {
        const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(slug)

        let query = supabase
          .from('prestadores')
          .select(`
            ${COLUNAS_PRESTADOR_PUBLICO},
            cidades(nome, estado_sigla),
            categorias(nome, categorias_grupos(icone)),
            portfolio_projetos(
              id, titulo, descricao, status, created_at, sem_fotos,
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

        const { data: prestadorData, error: prestadorError } = await query.single()
        if (prestadorError) throw prestadorError
        const prestadorRaw = prestadorData as unknown as PrestadorRaw
        if (prestadorRaw.bloqueado === true) {
          throw new Error('PERFIL_BLOQUEADO')
        }

        // Ícone da área (martelo, casa…) para o avatar de quem não tem foto.
        const grupoRel = prestadorRaw.categorias?.categorias_grupos
        const grupo = Array.isArray(grupoRel) ? grupoRel[0] : grupoRel
        prestadorRaw.grupo_icone = grupo?.icone ?? null

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

        // Total de indicações (sem o limite de 10 da lista acima) — é a prova social do perfil.
        const { count: totalIndicacoesRaw, error: indicError } = await supabase
          .from('avaliacoes')
          .select('id', { count: 'exact', head: true })
          .eq('prestador_id', prestadorRaw.id)
          .eq('visivel', true)
          .eq('indica', true)
          .abortSignal(controller.signal)
        if (indicError) throw indicError

        // A vitrine aparece mesmo sem nome: sem título escrito, usa o padrão ("Fotos do profissional").
        prestadorRaw.sessao_fotos = Array.isArray(prestadorRaw.sessao_fotos_urls) && prestadorRaw.sessao_fotos_urls.length > 0
          ? { titulo: tituloDaVitrine(prestadorRaw.sessao_fotos_titulo), fotos: prestadorRaw.sessao_fotos_urls.slice(0, 5) }
          : null

        const projetos: ProjetoPerfil[] = normalizarArray(prestadorRaw.portfolio_projetos)
          .filter(p => ['em_execucao', 'finalizado'].includes(p.status))
          .map((p): ProjetoPerfil => ({
            id: p.id,
            titulo: p.titulo,
            descricao: p.descricao ?? undefined,
            status: p.status as ProjetoPerfil['status'],
            created_at: p.created_at,
            sem_fotos: p.sem_fotos ?? false,
            portfolio_fotos: normalizarArray<FotoProjeto>(p.portfolio_fotos)
              .filter(f => Boolean(f?.url_foto)),
            avaliacoes: avaliacoes
              .filter(av => av.projeto_id === p.id)
              .map(av => ({
                id:         av.id,
                indica:     av.indica ?? false,
                comentario: av.comentario ?? null,
              })),
            solicitacoes_garantia: normalizarArray<GarantiaRaw>(p.solicitacoes_garantia)
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

        let urlRetorno = fromParam ? sanitizarRotaInterna(fromParam) : '/prestadores'
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
          // portfolio_projetos já foi normalizado em `projetos`; não é repassado no prestador.
          prestador: { ...prestadorRaw, portfolio_projetos: undefined } as PrestadorPerfil,
          projetos,
          avaliacoes,
          totalIndicacoes: totalIndicacoesRaw ?? 0,
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
  }, [slug])

  return { data, loading, erro }
}

'use client'
// hooks/usePrestadores.ts

import { useState, useEffect, useMemo, useRef } from 'react'
import { getPrestadoresAtivos, getMediasAvaliacoes } from '@/lib/db/prestadores'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { pesoOrdenacao } from '@/lib/ordenacao'
import {
  calcularFacetas,
  decidirCidade,
  filtrarExibidos,
  normalizarCidade,
  parsearBusca,
} from '@/lib/buscaFiltros'
import { insertLog } from '@/lib/db/logs'
import { useFiltrosParams } from './useFiltrosParams'
import { useLocation } from '@/lib/contexts/LocationContext'
import type { Prestador } from '@/types/prestador'

// Mesma nota que o perfil público usa: a "efetiva" (ajustada por garantia) quando existe.
function calcularMedias(medias: { prestador_id: string; nota: number; nota_efetiva?: number | null }[]) {
  const map: Record<string, { soma: number; total: number }> = {}
  medias.forEach(({ prestador_id, nota, nota_efetiva }) => {
    if (!map[prestador_id]) map[prestador_id] = { soma: 0, total: 0 }
    map[prestador_id].soma += nota_efetiva ?? nota
    map[prestador_id].total += 1
  })
  return map
}

function normalizarId(valor: string | number | null | undefined): string {
  return valor == null ? '' : String(valor)
}

// Cache em memória da lista (vive enquanto a aba estiver aberta). Ao voltar do perfil
// a lista aparece na hora, sem skeleton, e o scroll pode ser restaurado.
const TTL_CACHE_LISTA_MS = 3 * 60 * 1000
const cacheLista = new Map<string, { dados: Prestador[]; em: number }>()

/** Esvazia o cache da lista (usado nos testes). */
export function limparCacheLista() {
  cacheLista.clear()
}

export function usePrestadores() {
  const {
    queryBusca,
    filtroHab,
    filtroCidade,
    filtroEstado,
    filtroRegiao,
    filtroGrupo,
    filtroCategoria,
    ampliar,
  } = useFiltrosParams()
  const { cidadeAtual } = useLocation()
  const cidadeSalvaId = cidadeAtual?.id
  const cidadeSalvaNome = cidadeAtual?.nome

  const [prestadoresBase, setPrestadoresBase] = useState<Prestador[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)
  const [tentativa, setTentativa] = useState(0)
  const buscasVaziasRegistradas = useRef(new Set<string>())

  // Fetch principal — só refaz quando a busca textual muda.
  // Filtros de localização/categoria filtram no cliente sobre prestadoresBase.
  useEffect(() => {
    let ativo = true

    async function fetchDados() {
      try {
        // A cidade salva é só o ponto de partida. Consultamos APENAS a cidade dela (menos dados)
        // quando é ela mesma que vale para a busca. Se a busca informa outra cidade, se há estado/
        // região, ou se a pessoa pediu "Ver outras cidades", consultamos o catálogo todo e o filtro
        // local faz o recorte. Sem cidade salva também é o catálogo todo: a lista nunca espera
        // permissão de localização.
        const { cidadeExtraida } = parsearBusca(queryBusca)
        const usaCidadeSalva = Boolean(
          cidadeSalvaId &&
          !ampliar && !cidadeExtraida && !filtroEstado && !filtroRegiao &&
          (!filtroCidade || normalizarCidade(filtroCidade) === normalizarCidade(cidadeSalvaNome))
        )
        const cidadeIdDaConsulta = usaCidadeSalva ? cidadeSalvaId : undefined

        const chaveCache = JSON.stringify([queryBusca, filtroHab, cidadeIdDaConsulta ?? null])
        const emCache = cacheLista.get(chaveCache)
        if (emCache && Date.now() - emCache.em < TTL_CACHE_LISTA_MS) {
          setPrestadoresBase(emCache.dados)
          setErro(false)
          setLoading(false)
          return
        }

        // Mantém a lista anterior até a nova chegar: o menu de filtros não some a cada refiltragem
        // (a página esconde os cards enquanto `loading`).
        setLoading(true)
        setErro(false)

        // O catálogo é público e stateless; não cancelamos o fetch manualmente.
        // Alguns navegadores, incluindo o Brave com Shields ativos, reportam o
        // cancelamento como erro de rede e deixavam a tela presa em "erro".
        const { data: pData, error: pError } = await getPrestadoresAtivos(cidadeIdDaConsulta)

        if (!ativo) return

        if (pError) throw pError

        const { data: medias, error: mediasError } = await getMediasAvaliacoes()
        if (mediasError) throw mediasError

        const mediaMap = calcularMedias(medias || [])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const normalizados: Prestador[] = ((pData || []) as any[]).map(p => {
          const cidadeRelacionada = Array.isArray(p.cidades) ? p.cidades[0] : p.cidades
          const categoriaRelacionada = Array.isArray(p.categorias) ? p.categorias[0] : p.categorias
          const regiaoRelacionada = Array.isArray(p.regioes) ? p.regioes[0] : p.regioes
          const regiaoDaCidade = cidadeRelacionada
            ? Array.isArray(cidadeRelacionada.regioes) ? cidadeRelacionada.regioes[0] : cidadeRelacionada.regioes
            : null
          const grupoRelacionado = Array.isArray(categoriaRelacionada?.categorias_grupos)
            ? categoriaRelacionada.categorias_grupos[0]
            : categoriaRelacionada?.categorias_grupos

          return {
            ...p,
            cidade_nome:   cidadeRelacionada?.nome                  || '',
            cidade_id:     normalizarId(cidadeRelacionada?.id           || p.cidade_id),
            categoria:     categoriaRelacionada?.nome               || 'Profissional',
            categoria_id:  normalizarId(categoriaRelacionada?.id         || p.categoria_id),
            estado_sigla:  p.estado_sigla                          || cidadeRelacionada?.estado_sigla || '',
            regiao_id:     normalizarId(p.regiao_id                    || cidadeRelacionada?.regiao_id),
            regiao_nome:   regiaoRelacionada?.nome                    || regiaoDaCidade?.nome || '',
            grupo_id:      normalizarId(p.grupo_id                     || categoriaRelacionada?.grupo_id || grupoRelacionado?.id),
            grupo_nome:    grupoRelacionado?.nome                    || '',
            media_nota:    mediaMap[p.id] ? mediaMap[p.id].soma / mediaMap[p.id].total : 0,
            total_avals:   mediaMap[p.id]?.total                    || 0,
          }
        })

        const { termo } = parsearBusca(queryBusca)
        const termoNorm = normalizarTermo(termo, filtroHab)

        const vitrines = normalizados.filter(p => p.origem_tipo === 'vitrine')
        const demais   = normalizados.filter(p => p.origem_tipo !== 'vitrine')
        const filtrados = filtrarPrestadores(demais, termoNorm)

        const listaFinal = [
          ...vitrines,
          ...[...filtrados].sort((a, b) => pesoOrdenacao(a) - pesoOrdenacao(b)),
        ]
        cacheLista.set(chaveCache, { dados: listaFinal, em: Date.now() })
        setPrestadoresBase(listaFinal)

      } catch (err) {
        if (!ativo) return
        const erroAbort = err as { name?: string; message?: string }
        const foiAbortado = erroAbort?.name === 'AbortError' || erroAbort?.message?.includes('aborted')
        if (foiAbortado) return
        console.error('[usePrestadores]', err)
        setPrestadoresBase([])
        setErro(true)
      } finally {
        if (ativo) setLoading(false)
      }
    }

    fetchDados()
    return () => {
      ativo = false
    }

  }, [
    queryBusca,
    filtroHab,
    filtroCidade,
    filtroEstado,
    filtroRegiao,
    ampliar,
    cidadeSalvaId,
    cidadeSalvaNome,
    tentativa,
  ])

  // ─── Cidade, filtros e opções ─────────────────────────────────────────────
  // Prioridade: cidade escrita na busca ("em X") > cidade da URL/filtro > cidade salva do usuário.
  // Estado/região escolhidos soltam a cidade salva; "Ver outras cidades" (ampliar) também.
  const cidadeDaBusca = parsearBusca(queryBusca).cidadeExtraida
  const { nome: cidadeNome, origem: origemCidade } = decidirCidade({
    cidadeDaBusca,
    filtroCidade,
    filtroEstado,
    filtroRegiao,
    ampliar,
    cidadeSalva: cidadeSalvaNome,
  })
  const cidadeEfetivaNormalizada = normalizarCidade(cidadeNome)

  const filtrosAtivos = useMemo(() => ({
    estado: filtroEstado,
    regiao: filtroRegiao,
    grupo: filtroGrupo,
    categoria: filtroCategoria,
    cidade: cidadeEfetivaNormalizada,
  }), [filtroEstado, filtroRegiao, filtroGrupo, filtroCategoria, cidadeEfetivaNormalizada])

  const prestadoresExibidos = useMemo(
    () => filtrarExibidos(prestadoresBase, filtrosAtivos),
    [prestadoresBase, filtrosAtivos],
  )

  // Contagem de cada opção = o que sobraria ao escolhê-la (ver lib/buscaFiltros.ts)
  const facetas = useMemo(
    () => calcularFacetas(prestadoresBase, filtrosAtivos),
    [prestadoresBase, filtrosAtivos],
  )

  useEffect(() => {
    const termo = queryBusca.trim()
    const temIntencaoDeBusca = Boolean(
      termo || filtroCidade || filtroEstado || filtroRegiao || filtroGrupo || filtroCategoria
    )

    if (loading || erro || prestadoresExibidos.length > 0 || !temIntencaoDeBusca) return

    const chaveBusca = JSON.stringify({
      termo,
      filtroHab,
      filtroCidade,
      filtroEstado,
      filtroRegiao,
      filtroGrupo,
      filtroCategoria,
      cidadeEfetiva: cidadeEfetivaNormalizada,
      ampliar,
    })

    if (buscasVaziasRegistradas.current.has(chaveBusca)) return
    buscasVaziasRegistradas.current.add(chaveBusca)

    void insertLog({
      acao: 'BUSCA_SEM_SUCESSO',
      detalhes: {
        termo,
        filtroHab: filtroHab || null,
        cidade: filtroCidade || null,
        estado: filtroEstado || null,
        regiao: filtroRegiao || null,
        grupo: filtroGrupo || null,
        categoria: filtroCategoria || null,
        cidadeEfetiva: cidadeEfetivaNormalizada || null,
      },
    }).catch((error) => {
      console.error('Falha ao registrar busca sem resultados:', error)
    })
  }, [
    queryBusca,
    filtroHab,
    filtroCidade,
    filtroEstado,
    filtroRegiao,
    filtroGrupo,
    filtroCategoria,
    cidadeEfetivaNormalizada,
    loading,
    erro,
    ampliar,
    prestadoresExibidos.length,
  ])

  return {
    prestadoresBase,
    prestadoresExibidos,
    estadosDisponiveis: facetas.estados,
    regioesDisponiveis: facetas.regioes,
    cidadesDisponiveis: facetas.cidades,
    gruposDisponiveis: facetas.grupos,
    categoriasDisponiveis: facetas.categorias,
    loading,
    erro,
    /** Cidade que está valendo para a busca (null = sem recorte de cidade) e de onde ela veio. */
    cidadeNome,
    origemCidade,
    /** Tenta de novo depois de uma falha. */
    recarregar: () => setTentativa(n => n + 1),
  }
}

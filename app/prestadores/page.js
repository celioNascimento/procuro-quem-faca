'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { MapPin, Filter, Sparkles, AlertCircle } from 'lucide-react'

import PrestadorCard from '@/components/cards/PrestadorCard'
import AnuncioCard from '@/components/cards/AnuncioCard'

function ListaSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-5 md:px-6 space-y-4 pt-6">
      {[1, 2, 3, 4].map(i => (
        <div key={`sk-${i}`} className="w-full h-32 bg-white rounded-[2.5rem] border border-slate-50 animate-pulse" />
      ))}
    </div>
  )
}

function ListaConteudo() {
  const searchParams  = useSearchParams()
  const router        = useRouter()

  const queryBusca    = (searchParams.get('q')         || '').trim()
  const filtroHab     = (searchParams.get('habilidade') || '').trim()
  const filtroCidNome =  searchParams.get('cidade')    || ''

  const [prestadoresBase, setPrestadoresBase] = useState([])
  const [anuncios,        setAnuncios]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [erro,            setErro]            = useState(false)

  // BUG 2 FIX: pathname explícito — router.push("?cidade=X") sem pathname
  // é interpretado como push para "/" em algumas configs do Next.js App Router.
  const toggleCidade = (nomeCidade) => {
    const params = new URLSearchParams(searchParams)
    if (filtroCidNome === nomeCidade) params.delete('cidade')
    else params.set('cidade', nomeCidade)
    router.push(`/prestadores?${params.toString()}`)
  }

  useEffect(() => {
    async function fetchDados() {
      setLoading(true)
      setErro(false)
      // Limpa lista imediatamente ao iniciar novo fetch — evita cidades
      // do resultado anterior aparecerem no filtro durante o carregamento
      setPrestadoresBase([])

      try {
        const { data: pData, error: pError } = await supabase
          .from('prestadores')
          .select('*, cidades(id, nome, estado_sigla, regiao_id), categorias(nome)')
          .eq('status', 'ativo')
          .order('verificado', { ascending: false })

        if (pError) throw pError

        const normalizados = (pData || []).map(p => ({
          ...p,
          cidade_nome: p.cidades?.nome || '',
          categoria:   p.categorias?.nome || 'Profissional'
        }))

        const termo = normalizarTermo(queryBusca, filtroHab)
        setPrestadoresBase(filtrarPrestadores(normalizados, termo))

        const { data: ads } = await supabase
          .from('anuncios').select('*').eq('status', true)
        setAnuncios(ads || [])

      } catch (err) {
        console.error('[PaginaPrestadores]', err)
        setErro(true)
      } finally {
        setLoading(false)
      }
    }
    fetchDados()
  }, [queryBusca, filtroHab])

  const cidadesDisponiveis = useMemo(() => {
    const set = new Set()
    prestadoresBase.forEach(p => {
      if (p.cidade_nome) set.add(p.cidade_nome)
      if (Array.isArray(p.cidades_atendidas))
        p.cidades_atendidas.forEach(c => { if (c?.trim()) set.add(c.trim()) })
    })
    return Array.from(set).sort()
  }, [prestadoresBase])

  const prestadoresExibidos = useMemo(() => {
    if (!filtroCidNome) return prestadoresBase
    return prestadoresBase.filter(p =>
      p.cidade_nome === filtroCidNome ||
      p.cidades_atendidas?.some(c => c?.trim() === filtroCidNome)
    )
  }, [prestadoresBase, filtroCidNome])

  const bannerTopo   = anuncios.find(a => a.posicao === 'topo')
  const anunciosMeio = anuncios.filter(a => a.posicao === 'meio')

  const tituloBusca = queryBusca
    ? `Resultados para "${queryBusca}"`
    : `Profissionais em ${filtroCidNome || 'sua região'}`

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-6 space-y-6">

      {/* Filtro de cidades — só aparece quando há resultados carregados */}
      {!loading && cidadesDisponiveis.length > 0 && (
        <div className="sticky top-20 z-40 -mx-5 md:-mx-6 px-5 md:px-6 py-3 bg-[#FDFDFD]/95 backdrop-blur-md border-b border-slate-100/80 shadow-sm">
          <div
            className="flex items-center gap-3 overflow-x-auto py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-2 rounded-2xl shrink-0">
              <Filter size={13} className="text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Filtrar</span>
            </div>
            <div className="flex items-center gap-2">
              {cidadesDisponiveis.map(nome => {
                // Conta quantos prestadores existem nesta cidade
                const count = prestadoresBase.filter(p =>
                  p.cidade_nome === nome ||
                  p.cidades_atendidas?.some(c => c?.trim() === nome)
                ).length

                return (
                  <button
                    key={nome}
                    onClick={() => toggleCidade(nome)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-[1.2rem] text-[11px] font-bold transition-all shrink-0 border ${
                      filtroCidNome === nome
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                    }`}
                  >
                    {nome}
                    {/* Contador de prestadores — feedback imediato antes de clicar */}
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      filtroCidNome === nome
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Banner topo */}
      {!loading && bannerTopo?.imagem_url && (
        <div className="relative group rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white animate-in fade-in zoom-in-95 duration-700">
          <img
            src={bannerTopo.imagem_url}
            className="w-full h-36 md:h-48 object-cover transition-transform duration-1000 group-hover:scale-105"
            alt={bannerTopo.titulo || 'Destaque'}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/20 to-transparent flex flex-col justify-center p-8 md:p-12">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Sparkles size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Destaque da Semana</span>
            </div>
            <h2 className="text-white text-2xl md:text-3xl font-black tracking-tight leading-none mb-4 max-w-xs">
              {bannerTopo.titulo}
            </h2>
            {bannerTopo.link_destino && (
              <a
                href={bannerTopo.link_destino}
                className="w-fit bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg active:scale-95"
              >
                Ver Agora
              </a>
            )}
          </div>
        </div>
      )}

      {/* Cabeçalho da lista */}
      <div className="flex items-center justify-between px-2 border-l-4 border-blue-600 ml-1 py-1">
        <div>
          <h3 className="text-[13px] md:text-[14px] font-bold text-slate-800 leading-none">
            {tituloBusca}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-medium">
            Resultados da busca
          </p>
        </div>
        {!loading && prestadoresExibidos.length > 0 && (
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
            {prestadoresExibidos.length} {prestadoresExibidos.length === 1 ? 'encontrado' : 'encontrados'}
          </span>
        )}
      </div>

      {/* Erro */}
      {erro && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-[2rem] px-6 py-4">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-[13px] font-medium text-red-600">
            Não foi possível carregar os profissionais. Verifique sua conexão e recarregue a página.
          </p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={`sk-${i}`} className="w-full h-32 bg-white rounded-[2.5rem] border border-slate-50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {prestadoresExibidos.map((p, index) => (
            <div key={p.id}>
              <PrestadorCard prestador={p} />
              {anunciosMeio.length > 0 && (index + 1) % 3 === 0 && (
                <AnuncioCard
                  anuncio={anunciosMeio[Math.floor((index + 1) / 3 - 1) % anunciosMeio.length]}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!loading && !erro && prestadoresExibidos.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center gap-5">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner">
            <MapPin size={32} className="text-slate-200" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-700 mb-1">Nenhum profissional encontrado</h3>
            <p className="text-[13px] text-slate-400 max-w-[240px] mx-auto font-medium leading-relaxed">
              Tente remover os filtros ou buscar por uma categoria diferente.
            </p>
          </div>
          {filtroCidNome && (
            <button
              onClick={() => toggleCidade(filtroCidNome)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[11px] font-bold uppercase tracking-wide hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
            >
              Remover filtro de cidade
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-16 antialiased selection:bg-blue-100">
      {/* BUG 1 FIX: sem prop href — router.back() é usado automaticamente.
          href="/" forçava voltar sempre para a home, ignorando o histórico. */}
      <Header />
      <div className="pt-20 md:pt-24">
        <Suspense fallback={<ListaSkeleton />}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}
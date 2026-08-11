// app/prestadores/page.tsx

'use client'

export const dynamic = 'force-dynamic'

import { Fragment, Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePrestadores } from '@/hooks/usePrestadores'
import { useSession } from '@/hooks/useSession'
import Header from '@/components/Header'
import PrestadorCard from '@/components/cards/PrestadorCard'
import { AdCard } from '@/components/ads/AdCard'
import { MapPin, Filter, AlertCircle, X } from 'lucide-react'
import { getTituloBusca } from '@/lib/prestadorUtils'
import { ListaSkeleton } from '@/components/skeletons/ListaSkeletonPrestadores'
import { supabase } from '@/lib/supabase/client'
import type { Prestador } from '@/types/prestador'
import type { Anuncio } from '@/types/ads'

// Função utilitária para embaralhar o array (Fisher-Yates Shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/* Botão de cidade reutilizado no mobile (chip) e no desktop (linha da sidebar) */
function BotaoCidade({
  nome,
  count,
  ativo,
  variante,
  onClick,
}: {
  nome: string
  count: number
  ativo: boolean
  variante: 'chip' | 'linha'
  onClick: () => void
}) {
  if (variante === 'linha') {
    return (
      <button
        onClick={onClick}
        aria-pressed={ativo}
        className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-bold transition-all border ${
          ativo
            ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
        }`}
      >
        <span className="truncate text-left">{nome}</span>
        <span
          className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
            ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {count}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold transition-all shrink-0 border ${
        ativo
          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {nome}
      <span
        className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
          ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function ListaConteudo() {
  const searchParams = useSearchParams()
  const queryBusca = (searchParams.get('q') || '').trim()
  const filtroHab = (searchParams.get('habilidade') || '').trim()
  const filtroCidNome = searchParams.get('cidade') || ''

  const { prestadoresBase, prestadoresExibidos, cidadesDisponiveis, loading, erro, toggleCidade } =
    usePrestadores(queryBusca, filtroHab, filtroCidNome)
  const session = useSession()

  // Estado para armazenar os anúncios públicos
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])

  useEffect(() => {
    async function carregarAnuncios() {
      const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .eq('status', true)
        .eq('status_aprovacao', 'aprovado')

      if (!error && data) {
        // Embaralha os anúncios logo que chegam do banco para democratizar as impressões
        const anunciosEmbaralhados = shuffleArray(data as Anuncio[])
        setAnuncios(anunciosEmbaralhados)
      }
    }
    carregarAnuncios()
  }, [])

  const tituloBusca = getTituloBusca(queryBusca, filtroCidNome)

  const contarCidade = (nome: string) => {
    const nomeNorm = nome.toLowerCase().trim()
    return prestadoresBase.filter(
      p =>
        p.cidade_nome?.toLowerCase().trim() === nomeNorm ||
        p.cidades_atendidas?.some(c => c?.toLowerCase().trim() === nomeNorm)
    ).length
  }

  const temFiltro = Boolean(filtroCidNome)
  
  // Separação de anúncios por posição
  const anunciosTopo = anuncios.filter(a => a.posicao === 'topo_busca')
  const anunciosMeio = anuncios.filter(a => a.posicao === 'entre_cards')

  return (
    <>
      {/* Barra de filtros — apenas MOBILE / tablet (scroll horizontal) */}
      {!loading && cidadesDisponiveis.length > 0 && (
        <div className="lg:hidden sticky top-16 md:top-28 z-50 bg-[#FDFDFD]/98 backdrop-blur-sm border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-5 md:px-6 py-2">
            <div
              className="flex items-center gap-3 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div className="flex items-center gap-2 bg-slate-100/80 px-3 py-2 rounded-full shrink-0">
                <Filter size={14} className="text-slate-500" />
                <span className="text-[12px] font-bold uppercase tracking-widest text-slate-600">Filtrar</span>
              </div>
              <div className="flex items-center gap-2">
                {cidadesDisponiveis.map(nome => (
                  <BotaoCidade
                    key={nome}
                    nome={nome}
                    count={contarCidade(nome)}
                    ativo={filtroCidNome.toLowerCase().trim() === nome.toLowerCase().trim()}
                    variante="chip"
                    onClick={() => toggleCidade(nome)}
                  />
                ))}
              </div>
              {temFiltro && (
                <button
                  onClick={() => toggleCidade(filtroCidNome)}
                  className="flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-bold text-slate-500 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={13} strokeWidth={3} /> Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid: sidebar no desktop, coluna única no mobile */}
      <div className="max-w-6xl mx-auto px-5 md:px-6 pt-6 lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">

        {/* Sidebar de filtros — apenas DESKTOP */}
        {!loading && cidadesDisponiveis.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter size={15} className="text-slate-500" />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-slate-600">
                    Filtrar por cidade
                  </span>
                </div>
                {temFiltro && (
                  <button
                    onClick={() => toggleCidade(filtroCidNome)}
                    className="flex items-center gap-1 text-[12px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} strokeWidth={3} /> Limpar
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {cidadesDisponiveis.map(nome => (
                  <BotaoCidade
                    key={nome}
                    nome={nome}
                    count={contarCidade(nome)}
                    ativo={filtroCidNome.toLowerCase().trim() === nome.toLowerCase().trim()}
                    variante="linha"
                    onClick={() => toggleCidade(nome)}
                  />
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Coluna principal */}
        <div className="space-y-6 min-w-0">

          <div className="flex items-center justify-between border-l-4 border-blue-600 pl-4 py-1">
            <div>
              <h1 className="text-[15px] md:text-[16px] font-bold text-slate-800 leading-none text-balance">
                {tituloBusca}
              </h1>
              <p className="text-[12px] text-slate-400 mt-1.5 uppercase tracking-widest font-medium">
                Resultados da busca
              </p>
            </div>
            {!loading && prestadoresExibidos.length > 0 && (
              <span
                role="status"
                className="text-[13px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shrink-0"
              >
                {prestadoresExibidos.length} {prestadoresExibidos.length === 1 ? 'encontrado' : 'encontrados'}
              </span>
            )}
          </div>

          {erro && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-3xl px-6 py-4">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <p className="text-[13px] font-medium text-red-600">
                Não foi possível carregar os profissionais. Verifique sua conexão e recarregue a página.
              </p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-32 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Anúncio no topo da lista (ocupa a linha inteira) */}
              {prestadoresExibidos.length > 0 && (
                <div className="lg:col-span-2">
                  <AdCard 
                    page="lista_topo" 
                    anuncio={anunciosTopo[0] ?? null} 
                    categoria={queryBusca || filtroHab || ''} 
                  />
                </div>
              )}

              {prestadoresExibidos.map((p: Prestador, index: number) => (
                <Fragment key={p.id}>
                  <PrestadorCard prestador={p} session={session} />
                  
                  {/* Anúncio intercalado a cada 4 cards, usando rodízio sequencial do array já embaralhado */}
                  {(index + 1) % 4 === 0 && (
                    <div className="lg:col-span-2">
                      <AdCard 
                        page="prestadores" 
                        anuncio={anunciosMeio[Math.floor(index / 4) % Math.max(anunciosMeio.length, 1)] ?? null} 
                        categoria={queryBusca || filtroHab || ''} 
                      />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}

          {!loading && !erro && prestadoresExibidos.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-5">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-inner">
                <MapPin size={32} className="text-slate-200" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-700 mb-1">Nenhum profissional encontrado</h2>
                <p className="text-[13px] text-slate-400 max-w-[240px] mx-auto font-medium leading-relaxed">
                  Tente remover os filtros ou buscar por uma categoria diferente.
                </p>
              </div>
              {filtroCidNome && (
                <button
                  onClick={() => toggleCidade(filtroCidNome)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[12px] font-bold uppercase tracking-wide hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                >
                  Remover filtro de cidade
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-16 antialiased selection:bg-blue-100">
      <Header href="/" />
      <div className="pt-16 md:pt-28">
        <Suspense fallback={<ListaSkeleton />}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}
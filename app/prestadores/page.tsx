'use client'

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePrestadores } from '@/hooks/usePrestadores'
import { useSession } from '@/hooks/useSession'
import { useLog } from '@/hooks/useLog'
import Header from '@/components/Header'
import PrestadorCard from '@/components/cards/PrestadorCard'
import AnuncioCard from '@/components/cards/AnuncioCard'
import { MapPin, Filter, AlertCircle } from 'lucide-react'
import { getTituloBusca } from '@/lib/prestadorUtils'
import { ListaSkeleton } from '@/components/skeletons/ListaSkeletonPrestadores'


function ListaConteudo() {
  const searchParams = useSearchParams()
  const queryBusca = (searchParams.get('q') || '').trim()
  const filtroHab = (searchParams.get('habilidade') || '').trim()
  const filtroCidNome = searchParams.get('cidade') || ''

  const { prestadoresBase, prestadoresExibidos, cidadesDisponiveis, loading, erro, toggleCidade } =
    usePrestadores(queryBusca, filtroHab, filtroCidNome)
  const session = useSession()
  const { registrarLog } = useLog()

  const tituloBusca = getTituloBusca(queryBusca, filtroCidNome)

  return (
    <>
      {!loading && cidadesDisponiveis.length > 0 && (
        <div className="sticky top-20 md:top-28 z-50 bg-[#FDFDFD]/98 backdrop-blur-sm border-b border-slate-100 shadow-sm">
          <div className="max-w-4xl mx-auto px-5 md:px-6 py-3">
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
                  const nomeNorm = nome.toLowerCase().trim()
                  const ativo = filtroCidNome.toLowerCase().trim() === nomeNorm
                  const count = prestadoresBase.filter(p =>
                    p.cidade_nome?.toLowerCase().trim() === nomeNorm ||
                    p.cidades_atendidas?.some(c => c?.toLowerCase().trim() === nomeNorm)
                  ).length
                  return (
                    <button
                      key={nome}
                      onClick={() => toggleCidade(nome)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-[1.2rem] text-[11px] font-bold transition-all shrink-0 border ${ativo
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                        }`}
                    >
                      {nome}
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${ativo ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-5 md:px-6 space-y-6 pt-6">

        <div className="flex items-center justify-between px-2 border-l-4 border-blue-600 ml-1 py-1">
          <div>
            <h3 className="text-[13px] md:text-[14px] font-bold text-slate-800 leading-none">{tituloBusca}</h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-medium">Resultados da busca</p>
          </div>
          {!loading && prestadoresExibidos.length > 0 && (
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              {prestadoresExibidos.length} {prestadoresExibidos.length === 1 ? 'encontrado' : 'encontrados'}
            </span>
          )}
        </div>

        {erro && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-[2rem] px-6 py-4">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p className="text-[13px] font-medium text-red-600">
              Não foi possível carregar os profissionais. Verifique sua conexão e recarregue a página.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-full h-32 bg-white rounded-[2.5rem] border border-slate-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {prestadoresExibidos.map((p, index) => (
              <div key={p.id}>
                <PrestadorCard prestador={p} session={session} registrarLog={registrarLog} />
                {(index + 1) % 4 === 0 && (
                  <AnuncioCard anuncio={null} contexto={queryBusca || filtroHab || ''} />
                )}
              </div>
            ))}
          </div>
        )}

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
    </>
  )
}

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-16 antialiased selection:bg-blue-100">
      <Header href="/" />
      <div className="pt-20 md:pt-28">
        <Suspense fallback={<ListaSkeleton />}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}

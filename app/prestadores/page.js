'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { MapPin, Filter, Sparkles, CheckCircle2 } from 'lucide-react'

import PrestadorCard from '@/components/cards/PrestadorCard'
import AnuncioCard from '@/components/cards/AnuncioCard' // Inclusão Cirúrgica 01

function ListaConteudo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const queryBusca = (searchParams.get('q') || '').trim()
  const filtroHab = (searchParams.get('habilidade') || '').trim()
  const filtroCidNome = searchParams.get('cidade')

  const [prestadoresBase, setPrestadoresBase] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)

  const toggleCidade = (nomeCidade) => {
    const params = new URLSearchParams(searchParams)
    if (filtroCidNome === nomeCidade) params.delete('cidade')
    else params.set('cidade', nomeCidade)
    router.push(`?${params.toString()}`)
  }

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      try {
        let query = supabase
          .from('prestadores')
          .select('*, cidades(id, nome, estado_sigla, regiao_id), categorias(nome)')
          .eq('status', 'ativo')
          .order('verificado', { ascending: false });

        const { data: pData } = await query;
        
        const normalizados = (pData || []).map(p => ({
          ...p,
          cidade_nome: p.cidades?.nome || '',
          categoria: p.categorias?.nome || 'Profissional'
        }));

        const termoUnificado = normalizarTermo(queryBusca, filtroHab);
        const resultadosPosTexto = filtrarPrestadores(normalizados, termoUnificado);

        setPrestadoresBase(resultadosPosTexto);

        const { data: ads } = await supabase.from('anuncios').select('*').eq('status', true);
        setAnuncios(ads || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDados();
  }, [queryBusca, filtroHab]);

  const cidadesDisponiveis = useMemo(() => {
    const cidadesSet = new Set();
    prestadoresBase.forEach(p => {
      if (p.cidade_nome) cidadesSet.add(p.cidade_nome);
      if (p.cidades_atendidas && Array.isArray(p.cidades_atendidas)) {
        p.cidades_atendidas.forEach(c => {
          if (c) cidadesSet.add(c.trim());
        });
      }
    });
    return Array.from(cidadesSet).sort();
  }, [prestadoresBase]);

  const prestadoresExibidos = useMemo(() => {
    if (!filtroCidNome) return prestadoresBase;

    return prestadoresBase.filter(p => {
      const moraAqui = p.cidade_nome === filtroCidNome;
      const atendeAqui = p.cidades_atendidas?.some(c => c.trim() === filtroCidNome);
      return moraAqui || atendeAqui;
    });
  }, [prestadoresBase, filtroCidNome]);

  const bannerTopo = anuncios.find(a => a.posicao === 'topo' && a.status);
  const anuncioMeio = anuncios.find(a => a.posicao === 'meio' && a.status); // Inclusão Cirúrgica 02

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-6 space-y-8">
      
      {/* FILTRO DINÂMICO DE CIDADES */}
      {cidadesDisponiveis.length > 0 && (
        <div className="sticky top-16 md:top-20 z-40 -mx-6 px-6 py-3 mb-4 bg-[#FDFDFD]/95 backdrop-blur-md border-b border-slate-100/80 shadow-sm transition-all">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2">
            <div className="flex items-center gap-2 bg-slate-100/80 px-4 py-2.5 rounded-2xl shrink-0">
              <Filter size={14} className="text-slate-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Filtrar</span>
            </div>
            
            <div className="flex items-center gap-3">
              {cidadesDisponiveis.map(nome => (
                <button
                  key={nome}
                  onClick={() => toggleCidade(nome)}
                  className={`px-5 py-2.5 rounded-[1.3rem] text-[12px] font-bold transition-all shrink-0 border ${
                    filtroCidNome === nome 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BANNER DE ANÚNCIO - Topo */}
      {!loading && bannerTopo && (
        <div className="relative group rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white animate-in fade-in zoom-in-95 duration-700">
           <img src={bannerTopo.imagem_url} className="w-full h-36 md:h-48 object-cover transition-transform duration-1000 group-hover:scale-105" alt="Destaque" />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/20 to-transparent flex flex-col justify-center p-8 md:p-12">
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Sparkles size={16} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Destaque da Semana</span>
              </div>
              <h2 className="text-white text-2xl md:text-3xl font-black tracking-tight leading-none mb-4 max-w-xs">{bannerTopo.titulo}</h2>
              <a href={bannerTopo.link_destino} className="w-fit bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg active:scale-95">Ver Agora</a>
           </div>
        </div>
      )}

      {/* LISTA DE PRESTADORES */}
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center justify-between px-2 border-l-4 border-blue-600 ml-1 py-1">
           <div className="flex flex-col">
              <h3 className="text-[13px] md:text-[14px] font-bold text-slate-800 leading-none">
                Profissionais em {filtroCidNome || 'sua região'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-medium">Resultados da busca</p>
           </div>
           <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
             {prestadoresExibidos.length} ativos
           </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="w-full h-32 bg-white rounded-[2.5rem] border border-slate-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {prestadoresExibidos.map((p, index) => (
              <div key={p.id}>
                <PrestadorCard prestador={p} />
                
                {/* Inclusão Cirúrgica 03: Injeção de Anúncio a cada 3 cards */}
                {(index + 1) % 3 === 0 && anuncioMeio && (
                  <AnuncioCard anuncio={anuncioMeio} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && prestadoresExibidos.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
             <MapPin size={32} className="text-slate-200" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum profissional encontrado</h3>
          <p className="text-[13px] text-slate-400 max-w-[240px] font-medium leading-relaxed">
            Tente remover os filtros ou buscar por uma categoria diferente.
          </p>
        </div>
      )}
    </div>
  )
}

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-16 antialiased selection:bg-blue-100">
      <Header href="/" />
      <div className="pt-15 md:pt-24">
        <Suspense fallback={null}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}
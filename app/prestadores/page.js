'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'
import { MapPin, Filter, Sparkles, ChevronRight } from 'lucide-react'

import PrestadorCard from '@/components/cards/PrestadorCard'
import AnuncioCard from '@/components/cards/AnuncioCard'

function ListaConteudo() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const queryBusca = (searchParams.get('q') || '').trim()
  const filtroHab = (searchParams.get('habilidade') || '').trim()
  const filtroCid = searchParams.get('cidade')
  const filtroReg = searchParams.get('regiao')
  const filtroEst = searchParams.get('estado')

  const [prestadores, setPrestadores] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [cidadesFiltro, setCidadesFiltro] = useState([])
  const [loading, setLoading] = useState(true)

  const toggleCidade = (id) => {
    const params = new URLSearchParams(searchParams)
    if (filtroCid === id) params.delete('cidade')
    else params.set('cidade', id)
    router.push(`?${params.toString()}`)
  }

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      try {
        const { data: cData } = await supabase
          .from('cidades')
          .select(`id, nome, prestadores!inner(status)`)
          .eq('prestadores.status', 'ativo')
          .eq('ativa', true)
          .order('nome');

        const cidadesUnicas = Array.from(new Map(cData?.map(item => [item.id, item])).values());
        setCidadesFiltro(cidadesUnicas || []);

        let query = supabase
          .from('prestadores')
          .select('*, cidades!inner(id, nome, estado_sigla, regiao_id), categorias(nome)')
          .eq('status', 'ativo')
          .order('verificado', { ascending: false });

        if (filtroCid) query = query.eq('cidade_id', filtroCid);
        if (filtroReg) query = query.eq('cidades.regiao_id', filtroReg);
        if (filtroEst) query = query.eq('cidades.estado_sigla', filtroEst.toUpperCase());

        const { data: pData } = await query;
        const prestadoresNormalizados = (pData || []).map(p => ({
          ...p,
          categoria: p.categorias?.nome || 'Profissional'
        }));

        const termoUnificado = normalizarTermo(queryBusca, filtroHab);
        let resultados = filtrarPrestadores(prestadoresNormalizados, termoUnificado);

        setPrestadores(resultados);

        const { data: ads } = await supabase.from('anuncios').select('*').eq('status', true);
        setAnuncios(ads || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDados();
  }, [queryBusca, filtroHab, filtroCid, filtroReg, filtroEst]);

  const bannerTopo = anuncios.find(a => a.posicao === 'topo' && a.status);

  return (
    /* Reduzi space-y-10 para space-y-6 para aproximar banner e resultados */
    <div className="max-w-4xl mx-auto px-6 space-y-6">
      
      {/* FILTRO POR CIDADES - Reduzi padding vertical (py-4 para py-2) */}
      {cidadesFiltro.length > 0 && (
        <div className="sticky top-16 md:top-20 z-40 -mx-6 px-6 py-2 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm shrink-0">
              <Filter size={12} className="text-blue-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Onde:</span>
            </div>
            {cidadesFiltro.map(c => (
              <button
                key={c.id}
                onClick={() => toggleCidade(c.id)}
                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                  filtroCid === c.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BANNER DE DESTAQUE - Reduzi altura e margens */}
      {!loading && bannerTopo && (
        <div className="relative group rounded-[2rem] overflow-hidden shadow-xl border-2 border-white animate-in fade-in zoom-in-95 duration-700">
           <img src={bannerTopo.imagem_url} className="w-full h-32 md:h-44 object-cover transition-transform duration-1000 group-hover:scale-105" alt="Destaque" />
           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-transparent flex flex-col justify-center p-6 md:p-10">
              <div className="flex items-center gap-2 text-blue-200 mb-1">
                <Sparkles size={14} fill="currentColor" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em]">Recomendado</span>
              </div>
              <h2 className="text-white text-xl md:text-2xl font-black tracking-tighter leading-none mb-3">{bannerTopo.titulo}</h2>
              <a href={bannerTopo.link_destino} className="w-fit bg-white text-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95">Confira</a>
           </div>
        </div>
      )}

      {/* RESULTADOS - Aproximado do título */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
             <MapPin size={12} /> Profissionais
           </h3>
           <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/50">
             {prestadores.length} encontrados
           </span>
        </div>

        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="w-full h-28 bg-white rounded-[2rem] border border-slate-100 animate-pulse" />
          ))
        ) : (
          <div className="space-y-2">
            {prestadores.map((p) => (
              <PrestadorCard key={p.id} prestador={p} />
            ))}
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {!loading && prestadores.length === 0 && (
        <div className="py-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm mb-4">
             <span className="text-2xl">🏜️</span>
          </div>
          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Vazio por enquanto</p>
        </div>
      )}
    </div>
  )
}

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-16 antialiased selection:bg-blue-100">
      <Header href="/" />
      {/* Ajuste Crítico: pt-20 no mobile e pt-28 no desktop (antes era 24/32) */}
      <div className="pt-20 md:pt-28">
        <Suspense fallback={null}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}
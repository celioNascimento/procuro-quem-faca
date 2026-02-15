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
        // CORREÇÃO: Busca apenas cidades que REALMENTE têm prestadores ativos
        // Usamos um inner join implícito na query de contagem ou um rpc/view se fosse complexo, 
        // mas aqui faremos uma query limpa nas cidades que possuem relação com prestadores ativos.
        const { data: cData } = await supabase
          .from('cidades')
          .select(`
            id, 
            nome,
            prestadores!inner(status)
          `)
          .eq('prestadores.status', 'ativo')
          .eq('ativa', true)
          .order('nome');

        // Remover duplicatas de cidades causadas pelo join
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
    <div className="max-w-4xl mx-auto px-6 space-y-10">
      
      {/* FILTRO POR CIDADES - Inteligente */}
      {cidadesFiltro.length > 0 && (
        <div className="sticky top-20 z-40 -mx-6 px-6 py-4 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm shrink-0">
              <Filter size={14} className="text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Onde:</span>
            </div>
            {cidadesFiltro.map(c => (
              <button
                key={c.id}
                onClick={() => toggleCidade(c.id)}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                  filtroCid === c.id 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                }`}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BANNER DE DESTAQUE */}
      {!loading && bannerTopo && (
        <div className="relative group rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-100/50 border-4 border-white animate-in fade-in zoom-in-95 duration-700">
           <img src={bannerTopo.imagem_url} className="w-full h-40 md:h-56 object-cover transition-transform duration-1000 group-hover:scale-110" alt="Destaque" />
           <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-transparent flex flex-col justify-center p-8 md:p-12">
              <div className="flex items-center gap-2 text-blue-200 mb-2">
                <Sparkles size={16} fill="currentColor" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em]">Recomendado</span>
              </div>
              <h2 className="text-white text-2xl md:text-3xl font-black tracking-tighter leading-none mb-4">{bannerTopo.titulo}</h2>
              <a href={bannerTopo.link_destino} className="w-fit bg-white text-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95">Confira</a>
           </div>
        </div>
      )}

      {/* RESULTADOS */}
      <div className="grid grid-cols-1 gap-6">
        <div className="flex items-center justify-between px-4">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2">
             <MapPin size={14} /> Profissionais
           </h3>
           <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50">
             {prestadores.length} encontrados
           </span>
        </div>

        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="w-full h-32 bg-white rounded-[2.5rem] border border-slate-100 animate-pulse" />
          ))
        ) : (
          <div className="space-y-3">
            {prestadores.map((p) => (
              /* DICA: No seu componente PrestadorCard, tente remover 
                 o botão largo e usar um Chevron lateral para economizar espaço vertical */
              <PrestadorCard key={p.id} prestador={p} />
            ))}
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {!loading && prestadores.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] border border-slate-100 flex items-center justify-center shadow-sm mb-6 rotate-3">
             <span className="text-4xl">🏜️</span>
          </div>
          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Vazio por enquanto</p>
          <button 
            onClick={() => router.push('/busca')}
            className="mt-4 text-[10px] text-blue-600 font-black uppercase tracking-widest underline underline-offset-4"
          >
            Ver todos os profissionais
          </button>
        </div>
      )}
    </div>
  )
}

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 antialiased selection:bg-blue-100">
      <Header href="/" />
      <div className="pt-24 md:pt-32">
        <Suspense fallback={null}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}
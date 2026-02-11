'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'

// Importação dos Componentes Compartimentados
import PrestadorCard from '@/components/cards/PrestadorCard'
import AnuncioCard from '@/components/cards/AnuncioCard'

function ListaConteudo() {
  const searchParams = useSearchParams()
  const queryBusca = (searchParams.get('q') || '').trim()
  const filtroHab = (searchParams.get('habilidade') || '').trim()
  const filtroCid = searchParams.get('cidade')
  const filtroReg = searchParams.get('regiao')
  const filtroEst = searchParams.get('estado')

  const [prestadores, setPrestadores] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)

  const registrarLog = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert([{
        acao,
        entidade_tipo: 'busca',
        entidade_id: null,
        detalhes: { ...detalhes, t: new Date().toISOString() }
      }])
    } catch (err) {
      console.warn('Log ignorado.');
    }
  }

  const isAnuncioValido = (an) => {
    if (!an.status) return false;
    if (an.tipo === 'vip' && an.expira_em) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const [ano, mes, dia] = an.expira_em.split('-');
      const dataExp = new Date(ano, mes - 1, dia);
      if (dataExp < hoje) return false;
    }
    return true;
  }

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      try {
        // 1. Query principal
        let query = supabase
          .from('prestadores')
          .select('*, cidades!inner(id, nome, estado_sigla, regiao_id), categorias(nome)')
          .eq('status', 'ativo')
          .order('verificado', { ascending: false })
          .order('created_at', { ascending: true });

        // 2. Filtro por ID da Categoria
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryBusca);
        if (queryBusca && isUUID) {
            query = query.eq('categoria_id', queryBusca);
        }

        // 3. Filtros Geográficos
        if (filtroCid) query = query.eq('cidade_id', filtroCid);
        if (filtroReg) query = query.eq('cidades.regiao_id', filtroReg);
        if (filtroEst) query = query.eq('cidades.estado_sigla', filtroEst.toUpperCase());

        const { data: pData } = await query;

        // 4. Normalização
        const prestadoresNormalizados = (pData || []).map(p => ({
          ...p,
          categoria: p.categorias?.nome || p.categoria || 'Profissional'
        }));

        // 5. Filtragem e Busca Textual
        const termoUnificado = normalizarTermo(isUUID ? '' : queryBusca, filtroHab);
        let resultados = filtrarPrestadores(prestadoresNormalizados, termoUnificado);

        // 6. ORDENAÇÃO MANUAL
        resultados.sort((a, b) => {
          const aReivindicado = a.user_id ? 1 : 0;
          const bReivindicado = b.user_id ? 1 : 0;
          return bReivindicado - aReivindicado;
        });

        if (resultados.length === 0 && termoUnificado) {
          registrarLog('BUSCA_SEM_SUCESSO', { termo: termoUnificado });
        }
        setPrestadores(resultados);

        // 7. Busca de Anúncios
        const { data: ads } = await supabase
          .from('anuncios')
          .select('*')
          .eq('status', true)
          .order('created_at', { ascending: false });

        setAnuncios((ads || []).filter(isAnuncioValido));

      } catch (err) {
        console.error('Erro na busca:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDados();
  }, [queryBusca, filtroHab, filtroCid, filtroReg, filtroEst]);

  const adsTopo = anuncios.filter(a => a.posicao === 'topo');
  const bannerTopo = adsTopo.length > 0 ? adsTopo[0] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">
      {!loading && bannerTopo && (
        <div className="w-full mb-8 animate-in fade-in slide-in-from-top-4">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] ml-4 mb-2">Destaque</p>
          <a
            href={bannerTopo.link_destino}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-32 md:h-48 bg-slate-50 rounded-[2.5rem] border border-blue-100 overflow-hidden relative group shadow-md hover:shadow-xl transition-all"
            onClick={() => registrarLog('CLIQUE_ANUNCIO_TOPO', { anuncio_id: bannerTopo.id })}
          >
            {bannerTopo.imagem_url && (
              <>
                <img src={bannerTopo.imagem_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Destaque" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-8">
                  <span className="text-white font-black text-lg md:text-2xl tracking-tight drop-shadow-lg">{bannerTopo.titulo}</span>
                  <div className="ml-auto bg-blue-600 px-5 py-2.5 rounded-xl text-[10px] text-white font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Confira</div>
                </div>
              </>
            )}
          </a>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="w-full h-40 bg-white border border-slate-100 animate-pulse rounded-[2.5rem]" />
          ))
        ) : (
          prestadores.map((p) => (
            <PrestadorCard key={p.id} prestador={p} />
          ))
        )}
      </div>

      {!loading && prestadores.length === 0 && (
        <div className="bg-white border border-slate-100 p-16 rounded-[2.5rem] text-center flex flex-col items-center animate-in zoom-in-95 duration-500 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-2xl shadow-inner">🔎</div>
          <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Nenhum resultado</h3>
          <p className="text-slate-400 text-xs font-semibold max-w-xs mb-8 leading-relaxed italic">
            Não encontramos profissionais para sua busca neste momento. Tente utilizar termos mais genéricos.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
          >
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  )
}

// CORREÇÃO: Removemos a verificação manual de `mounted`.
// Deixamos o Suspense lidar com o carregamento assíncrono.
// Isso garante que o HTML do servidor (Header + Fallback) seja igual ao do cliente inicial.
export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 antialiased">
      <Header href="/" />
      <div className="pt-28 md:pt-40">
        <Suspense fallback={<div className="text-center p-20 font-black text-slate-300 uppercase tracking-[0.3em] animate-pulse text-[10px]">Sincronizando...</div>}>
          <ListaConteudo />
        </Suspense>
      </div>
    </div>
  )
}
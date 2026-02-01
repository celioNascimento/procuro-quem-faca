'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header' 
import { normalizarTermo, filtrarPrestadores } from '@/lib/buscaUtils'

function ListaConteudo() {
  const searchParams = useSearchParams()
  const queryBusca = (searchParams.get('q') || '').trim()
  const filtroHab = (searchParams.get('habilidade') || '').trim()
  const filtroCid = searchParams.get('cidade')
  const filtroReg = searchParams.get('regiao')
  const filtroEst = searchParams.get('estado')

  const [prestadores, setPrestadores] = useState([])
  const [anuncios, setAnuncios] = useState([]) // Guarda TODOS os anúncios
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const registrarLog = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao, entidade_tipo: 'busca',
        detalhes: { ...detalhes, t: new Date().toISOString() }
      })
    } catch (err) {}
  }

  // Lógica de validação de anúncio
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
    setMounted(true)
    async function fetchDados() {
      setLoading(true);
      try {
        // BUSCA PRESTADORES
        let query = supabase
          .from('prestadores')
          .select('*, cidades!inner(id, nome, estado_sigla, regiao_id)')
          .eq('status', 'ativo');

        if (filtroCid) query = query.eq('cidade_id', filtroCid);
        if (filtroReg) query = query.eq('cidades.regiao_id', filtroReg);
        if (filtroEst) query = query.ilike('cidades.estado_sigla', filtroEst);

        const { data: pData } = await query;
        const termoUnificado = normalizarTermo(queryBusca, filtroHab);
        let resultados = filtrarPrestadores(pData || [], termoUnificado);

        if (resultados.length === 0 && termoUnificado) {
          registrarLog('BUSCA_SEM_SUCESSO', { termo: termoUnificado });
        }
        setPrestadores(resultados);

        // BUSCA ANÚNCIOS (SEM FILTRO DE POSIÇÃO PARA PEGAR TOPO E LISTA)
        const { data: ads } = await supabase
          .from('anuncios')
          .select('*')
          .eq('status', true)
          .order('created_at', { ascending: false });
        
        const adsValidos = (ads || []).filter(isAnuncioValido);
        setAnuncios(adsValidos);

      } catch (err) {
        console.error('Erro na busca:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDados()
  }, [queryBusca, filtroHab, filtroCid, filtroReg, filtroEst])

  if (!mounted) return null;

  // Filtra os anúncios para uso no render
  const adsTopo = anuncios.filter(a => a.posicao === 'topo');
  const adsLista = anuncios.filter(a => a.posicao === 'lista');

  // Pega um aleatório ou o primeiro do topo para exibir
  const bannerTopo = adsTopo.length > 0 ? adsTopo[0] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">
      
      {/* --- BANNER DE TOPO (RESTAURADO) --- */}
      {!loading && bannerTopo && (
        <div className="w-full mb-8 animate-in fade-in slide-in-from-top-4">
          <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-4 mb-2">Destaque</p>
          {bannerTopo.tipo === 'google' ? (
             <div className="w-full h-32 md:h-48 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                <span className="text-xs text-slate-400">Publicidade Google (Topo)</span>
             </div>
          ) : (
            <a 
              href={bannerTopo.link_destino} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full h-32 md:h-48 bg-slate-50 rounded-[2.5rem] border border-blue-100 overflow-hidden relative group shadow-md hover:shadow-xl transition-all"
              onClick={() => registrarLog('CLIQUE_ANUNCIO_TOPO', { anuncio_id: bannerTopo.id })}
            >
              {bannerTopo.imagem_url ? (
                <img 
                  src={bannerTopo.imagem_url} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt="Destaque"
                />
              ) : null}
              {bannerTopo.imagem_url && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex items-end p-8">
                  <span className="text-white font-black text-lg md:text-xl tracking-tight drop-shadow-md">
                    {bannerTopo.titulo}
                  </span>
                  <div className="ml-auto bg-blue-600 px-4 py-2 rounded-xl text-[10px] text-white font-black uppercase tracking-widest shadow-lg">
                    Confira
                  </div>
                </div>
              )}
            </a>
          )}
        </div>
      )}

      {/* --- LISTA DE PRESTADORES --- */}
      {!loading && prestadores.length > 0 && prestadores.map((p, index) => {
        const isPublico = p.origem_tipo === 'curadoria_publica';
        
        // Lógica de injeção de anúncios (USANDO adsLista)
        const mostrarAd = index > 0 && index % 4 === 0 && adsLista.length > 0;
        const adIndex = Math.floor(index / 4) % adsLista.length;
        const anuncioAtual = adsLista[adIndex];

        return (
          <div key={p.id} className="space-y-6">
            <div className={`bg-white border p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group ${isPublico ? 'border-slate-100' : 'border-blue-50'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                    {p.foto_perfil ? (
                      <img src={p.foto_perfil} className="w-full h-full object-cover" alt={p.nome} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-semibold text-[10px] uppercase">Foto</div>
                    )}
                  </div>

                  <div className="flex flex-col items-start text-left gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-lg md:text-xl tracking-tight leading-none">
                        {p.nome}
                      </h3>
                      {isPublico && (
                        <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
                          Info Pública
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-blue-600 text-[11px] font-semibold uppercase tracking-wider">
                        {p.categoria}
                      </span>
                      {/* LÓGICA DE HABILIDADES MANTIDA */}
                      {p.habilidades && p.habilidades.length > 0 && (
                        <span className="text-[9px] text-slate-400 font-medium lowercase italic leading-tight mt-0.5">
                          + {p.habilidades.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 w-full mt-1">
                      <span className="text-slate-400 text-xs shrink-0">📍</span>
                      <p className="text-slate-400 text-[11px] font-medium tracking-tight truncate">
                        {p.bairro} <span className="mx-0.5 opacity-30">•</span> {p.cidades?.nome}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-3 shrink-0">
                  {isPublico && (
                    <Link 
                      href={`/reivindicar?id=${p.id}&nome=${encodeURIComponent(p.nome)}`}
                      className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide hover:text-indigo-600 transition-colors"
                    >
                      Este é você? Solicite aqui
                    </Link>
                  )}
                  
                  <Link 
                    href={`/${p.slug || p.id}`} 
                    onClick={() => registrarLog('CLIQUE_PERFIL', { nome: p.nome })}
                    className="w-full md:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 text-center"
                  >
                    Ver Perfil
                  </Link>
                </div>
              </div>
            </div>

            {/* CARD DE PUBLICIDADE (LISTA) */}
            {mostrarAd && anuncioAtual && (
              <div className="py-2 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-4 mb-2">Publicidade</p>
                
                {anuncioAtual.tipo === 'google' ? (
                   <div className="w-full h-32 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100">
                      <span className="text-xs text-slate-400">Publicidade Google</span>
                   </div>
                ) : (
                  <a 
                    href={anuncioAtual.link_destino} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full h-32 md:h-44 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden relative group shadow-sm hover:shadow-md transition-all"
                    onClick={() => registrarLog('CLIQUE_ANUNCIO', { anuncio_id: anuncioAtual.id })}
                  >
                    {anuncioAtual.imagem_url ? (
                      <img 
                        src={anuncioAtual.imagem_url} 
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
                        alt="Anúncio"
                      />
                    ) : null}
                    
                    {anuncioAtual.imagem_url && (
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-6">
                        <span className="text-white font-bold text-sm tracking-tight drop-shadow-md">
                          {anuncioAtual.titulo}
                        </span>
                        <div className="ml-auto bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] text-white font-black uppercase">
                          Saiba Mais
                        </div>
                      </div>
                    )}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!loading && prestadores.length === 0 && (
        <div className="bg-white border border-slate-100 p-14 rounded-[2.5rem] text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-xl">🔎</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum resultado</h3>
          <p className="text-slate-400 text-xs font-medium max-w-sm mb-8 leading-relaxed">
            Não encontramos profissionais para sua busca. Tente termos mais genéricos.
          </p>
          <button onClick={() => window.location.href = '/'} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all">
            Limpar Filtros
          </button>
        </div>
      )}
    </div>
  )
}

export default function PaginaPrestadores() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] pb-24 font-sans antialiased">
      <Header href="/" />
      <div className="pt-28 md:pt-40">
        <Suspense fallback={<div className="text-center p-20 font-bold text-slate-300 uppercase tracking-widest animate-pulse text-xs">Carregando...</div>}>
          <ListaConteudo />
        </Suspense>
      </div>
    </main>
  )
}
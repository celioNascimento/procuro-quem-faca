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
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)

  const registrarLog = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao, entidade_tipo: 'busca',
        detalhes: { ...detalhes, t: new Date().toISOString() }
      })
    } catch (err) {}
  }

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      try {
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

        const { data: ads } = await supabase
          .from('anuncios')
          .select('*')
          .eq('status', true)
          .order('created_at', { ascending: false });
        setAnuncios(ads || []);

      } catch (err) {
        console.error('Erro na busca:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDados()
  }, [queryBusca, filtroHab, filtroCid, filtroReg, filtroEst])

  return (
    <div className="max-w-3xl mx-auto px-4 space-y-6">
      
      {!loading && prestadores.length > 0 && prestadores.map((p, index) => {
        const isPublico = p.origem_tipo === 'curadoria_publica';
        const mostrarAd = index > 0 && index % 4 === 0 && anuncios.length > 0;
        const adIndex = Math.floor(index / 4) % anuncios.length;

        return (
          <div key={p.id} className="space-y-6">
            {/* CARD DO PRESTADOR */}
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

                    <span className="text-blue-600 text-[11px] font-semibold uppercase tracking-wider">
                      {p.categoria}
                    </span>

                    <div className="flex items-center gap-1.5 w-full">
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

            {/* ANÚNCIO */}
            {mostrarAd && anuncios[adIndex] && (
              <div className="py-2">
                <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-4 mb-2">Publicidade</p>
                <a 
                  href={anuncios[adIndex].link_url || anuncios[adIndex].link_destino} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full h-32 md:h-44 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden relative group"
                >
                  {anuncios[adIndex].imagem_url ? (
                    <img 
                      src={anuncios[adIndex].imagem_url} 
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
                      alt="Anúncio"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent flex items-end p-6">
                    <span className="text-white font-bold text-sm tracking-tight">
                      {anuncios[adIndex].titulo}
                    </span>
                  </div>
                </a>
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
          <Link href="/" className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all">
            Limpar Filtros
          </Link>
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
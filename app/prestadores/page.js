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
        const { data: ads } = await supabase.from('anuncios').select('*').eq('status', true).eq('posicao', 'topo');
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
    <div className="max-w-3xl mx-auto px-4">
      <div className="flex flex-col gap-4">
        
        {/* LISTA DE PRESTADORES (Se houver resultados) */}
        {!loading && prestadores.length > 0 && prestadores.map((p) => (
          <div key={p.id} className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col items-start text-left gap-1.5 flex-1">
                <h3 className="font-black text-slate-800 text-lg md:text-xl tracking-tighter leading-none uppercase italic">
                  {p.nome}
                </h3>
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                  {p.categoria}
                </span>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 my-0.5">
                  {p.habilidades?.slice(0, 5).map((tag, i) => (
                    <span key={i} className="text-slate-400 text-[10px] font-bold lowercase opacity-70 italic">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-1 w-full">
                  <span className="text-blue-500 text-xs shrink-0">📍</span>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-tight truncate">
                    {p.bairro} <span className="mx-0.5 opacity-20">•</span> {p.cidades?.nome}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end shrink-0">
                <Link 
                  href={`/${p.slug || p.id}`} 
                  onClick={() => registrarLog('CLIQUE_PERFIL', { nome: p.nome })}
                  className="w-full md:w-auto bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 whitespace-nowrap text-center"
                >
                  Ver Perfil
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* --- ESTADO VAZIO ELEGANTE (Novo) --- */}
        {!loading && prestadores.length === 0 && (
          <div className="bg-white border border-slate-100 p-10 md:p-14 rounded-[2.5rem] shadow-sm text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
            
            {/* Ícone Minimalista */}
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-slate-800 uppercase italic tracking-tighter mb-2">
              Nenhum resultado encontrado
            </h3>
            
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-md mb-8 leading-relaxed">
              Não encontramos profissionais com os filtros atuais. <br className="hidden md:block"/> Tente buscar por termos mais gerais ou outra região.
            </p>

            <Link 
              href="/" 
              className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 hover:text-slate-800 transition-all active:scale-95"
            >
              Limpar Filtros
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}

export default function PaginaPrestadores() {
  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-sans">
      <Header href="/" />
      <div className="pt-28 md:pt-36">
        <Suspense fallback={<div className="text-center p-10 font-black text-slate-300 uppercase tracking-widest animate-pulse">Buscando Profissionais...</div>}>
          <ListaConteudo />
        </Suspense>
      </div>
    </main>
  )
}
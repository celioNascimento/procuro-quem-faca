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
        {!loading && prestadores.map((p) => (
          <div key={p.id} className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-all relative group">
            {/* Container Principal: Coluna no mobile, Linha no desktop */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              
              {/* Grupo da Esquerda */}
              <div className="flex flex-col items-start text-left gap-1 flex-1">
                <h3 className="font-black text-slate-800 text-lg md:text-xl tracking-tighter leading-none uppercase italic">
                  {p.nome}
                </h3>
                
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md mb-1">
                  {p.categoria}
                </span>

                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {p.habilidades?.slice(0, 5).map((tag, i) => (
                    <span key={i} className="text-slate-400 text-[10px] font-bold lowercase opacity-70 italic">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>

                {/* Linha de Localização: Alinhada com o botão no Desktop */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-50 w-full">
                  <span className="text-blue-500 text-xs">📍</span>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-tight">
                    {p.bairro} <span className="mx-0.5 opacity-20">•</span> {p.cidades?.nome}
                  </p>
                </div>
              </div>

              {/* Lado Direito: Botão mantém o tamanho e alinha com a base no desktop */}
              <div className="flex items-center justify-end shrink-0">
                <Link 
                  href={`/${p.slug || p.id}`} 
                  onClick={() => registrarLog('CLIQUE_PERFIL', { nome: p.nome })}
                  className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 whitespace-nowrap text-center"
                >
                  Ver Perfil
                </Link>
              </div>

            </div>
          </div>
        ))}
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
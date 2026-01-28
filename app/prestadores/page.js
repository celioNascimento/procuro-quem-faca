'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import BackButton from '@/components/BackButton' 

function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-100 px-8 py-6 rounded-[2rem] flex items-center justify-between shadow-sm animate-pulse">
      <div className="space-y-3 flex-1">
        <div className="h-5 bg-slate-100 rounded-lg w-1/3" />
        <div className="h-3 bg-slate-50 rounded-lg w-1/2" />
      </div>
      <div className="h-10 bg-slate-100 rounded-xl w-24 ml-4" />
    </div>
  )
}

function ListaConteudo() {
  const searchParams = useSearchParams()
  const queryBusca = (searchParams.get('q') || '').trim()
  
  const filtroHab = searchParams.get('habilidade')
  const filtroCid = searchParams.get('cidade')
  const filtroReg = searchParams.get('regiao')
  const filtroEst = searchParams.get('estado')

  const [prestadores, setPrestadores] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDados()
  }, [queryBusca, filtroHab, filtroCid, filtroReg, filtroEst])

  const registrarLogClique = async (id, nome) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao: 'CLIQUE_VER_PERFIL',
        entidade_tipo: 'prestador',
        entidade_id: id,
        detalhes: { nome_prestador: nome }
      })
    } catch (err) {
      console.error('Erro log:', err)
    }
  }

  async function fetchDados() {
    setLoading(true);
    try {
      let query = supabase
        .from('prestadores')
        .select('*, cidades!inner(id, nome, estado_sigla, regiao_id)')
        .eq('status', 'ativo');

      if (filtroHab) query = query.contains('habilidades', [filtroHab]);
      if (filtroCid) query = query.eq('cidade_id', filtroCid);
      if (filtroReg) query = query.eq('cidades.regiao_id', filtroReg);
      if (filtroEst) query = query.ilike('cidades.estado_sigla', `%${filtroEst}%`);

      const { data: pData, error: pError } = await query;
      if (pError) throw pError;

      let resultadosFinais = pData || [];

      if (queryBusca && !filtroHab && !filtroCid && !filtroReg && !filtroEst) {
        const termo = queryBusca.toLowerCase();
        resultadosFinais = resultadosFinais.filter(p => 
          p.nome?.toLowerCase().includes(termo) ||
          p.categoria?.toLowerCase().includes(termo) ||
          p.bairro?.toLowerCase().includes(termo) ||
          p.cidades?.nome?.toLowerCase().includes(termo) ||
          (Array.isArray(p.habilidades) && p.habilidades.some(h => h.toLowerCase().includes(termo)))
        );
      }

      const { data: aData } = await supabase.from('anuncios').select('*').eq('status', true).eq('posicao', 'topo');
      
      setPrestadores(resultadosFinais);
      setAnuncios(aData || []);
    } catch (err) {
      console.error("Erro no carregamento:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      {!loading && anuncios.map(anuncio => (
        <div key={anuncio.id} className="mb-8">
          {anuncio.tipo === 'google' ? (
            <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: anuncio.codigo_google }} />
          ) : (
            <a href={anuncio.link_destino || '#'} target="_blank" className="block rounded-[2rem] overflow-hidden shadow-lg hover:scale-[1.01] transition-transform">
              <img src={anuncio.imagem_url} className="w-full h-32 object-cover block" alt={anuncio.titulo} />
            </a>
          )}
        </div>
      ))}

      <div className="flex flex-col gap-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : prestadores.length > 0 ? (
          prestadores.map((p) => (
            <div key={p.id} className="bg-white border border-slate-100 p-6 md:p-8 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all relative group overflow-hidden">
              <div className="flex flex-col items-start gap-1 w-full pr-24 text-left">
                
                <h3 className="font-bold text-slate-900 text-lg md:text-xl group-hover:text-blue-600 transition-colors">
                  {p.nome || 'Sem Nome'}
                </h3>

                <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1">
                  {p.categoria || 'Serviços'}
                </span>

                {p.habilidades && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1 mb-2">
                    {(Array.isArray(p.habilidades) ? p.habilidades : []).slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-slate-400 text-[10px] font-medium lowercase italic">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <p className="text-slate-400 text-[11px] font-medium uppercase tracking-tight">
                    📍 {p.bairro} • {p.cidades?.nome}
                  </p>
                </div>
              </div>

              <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2">
                <Link 
                  href={`/${p.slug || p.id}`} 
                  onClick={() => registrarLogClique(p.id, p.nome)}
                  className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 whitespace-nowrap"
                >
                  Ver Perfil
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <span className="text-4xl block mb-4">🔍</span>
            <h3 className="font-bold text-slate-400 uppercase text-xs">Nenhum profissional encontrado</h3>
            <Link href="/" className="inline-block mt-6 px-8 py-3 bg-slate-100 rounded-2xl text-slate-600 font-bold text-[10px] uppercase">
              Voltar e Tentar de Novo
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaginaPrestadores() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-2 mb-8 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 items-center">
          
          {/* COLUNA ESQUERDA: VOLTAR */}
          <div className="flex justify-start">
            <BackButton href="/" />
          </div>

          {/* COLUNA CENTRAL: LOGO AMPLIADA E DIV COM PADDING REDUZIDO */}
          <div className="flex justify-center">
            <img src="/logo.png" alt="Logo" className="h-16 md:h-20 w-auto object-contain transition-all" />
          </div>

          {/* COLUNA DIREITA: ESPAÇADOR PARA MANTER SIMETRIA NO MOBILE */}
          <div className="flex justify-end invisible md:visible">
             {/* Reservado para botões futuros se necessário */}
          </div>
          
        </div>
      </nav>

      <Suspense fallback={<div className="max-w-3xl mx-auto px-4"><CardSkeleton /></div>}>
        <ListaConteudo />
      </Suspense>
    </div>
  )
}
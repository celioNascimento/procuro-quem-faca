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
      <div className="h-12 bg-slate-100 rounded-xl w-28 ml-4" />
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

      <div className="flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : prestadores.length > 0 ? (
          prestadores.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 px-8 py-7 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-all shadow-sm group">
              <div className="flex-1 w-full text-left">
                <div className="mb-2">
                  {/* Nome ajustado: text-xl e font-bold para estilo App Premium */}
                  <h3 className="font-bold text-slate-900 uppercase text-xl group-hover:text-blue-600 transition-colors inline-block mr-2">
                    {p.nome || 'Sem Nome'}
                  </h3>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded align-middle">
                    {p.categoria || 'Serviços'}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  <p className="text-slate-400 text-[11px] font-medium uppercase tracking-tight">
                    📍 {p.bairro} • {p.cidades?.nome} - {p.cidades?.estado_sigla}
                  </p>
                </div>

                {p.habilidades && (
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(p.habilidades) ? p.habilidades : []).slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-blue-400/70 text-[10px] font-medium lowercase italic">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 md:mt-0 w-full md:w-auto">
                <Link 
                  href={`/${p.slug || p.id}`} 
                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-100 transition-all block text-center"
                >
                  Ver Perfil
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <span className="text-4xl block mb-4">🔍</span>
            <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Nenhum profissional encontrado</h3>
            <Link href="/" className="inline-block mt-6 px-8 py-3 bg-slate-100 rounded-2xl text-slate-600 font-bold text-[11px] uppercase">
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
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-6 mb-8 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 items-center">
          
          <div className="flex justify-start">
            <BackButton href="/" />
          </div>

          <div className="flex justify-center">
            <Link href="/" className="transition-transform hover:scale-105">
              {/* Logo Aumentada: h-16 no mobile e h-24 no desktop */}
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-16 md:h-24 w-auto object-contain block" 
              />
            </Link>
          </div>

          <div className="hidden md:block"></div>
          
        </div>
      </nav>

      <Suspense fallback={<div className="max-w-3xl mx-auto px-4"><CardSkeleton /></div>}>
        <ListaConteudo />
      </Suspense>
    </div>
  )
}
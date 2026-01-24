'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  const queryBusca = (searchParams.get('q') || '').toLowerCase().trim()

  const [prestadores, setPrestadores] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDados()
  }, [queryBusca])

  async function fetchDados() {
    setLoading(true);
    try {
      const { data: pData, error: pError } = await supabase
        .from('prestadores')
        .select('*, cidades(nome, estado_sigla)')
        .eq('status', 'ativo');

      if (pError) throw pError;

      const filtrados = (pData || []).filter(p => {
        if (!queryBusca) return true;
        const termo = queryBusca.toLowerCase();

        return (
          p.nome?.toLowerCase().includes(termo) ||
          p.categoria?.toLowerCase().includes(termo) ||
          p.bairro?.toLowerCase().includes(termo) ||
          p.cidades?.nome?.toLowerCase().includes(termo) ||
          (Array.isArray(p.habilidades) && p.habilidades.some(h => h.toLowerCase().includes(termo))) ||
          (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(termo)))
        );
      });

      const { data: aData } = await supabase
        .from('anuncios')
        .select('*')
        .eq('status', true)
        .eq('posicao', 'topo');

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const anunciosOrdenados = (aData || [])
        .filter(an => {
          if (an.tipo !== 'vip' || !an.expira_em) return true;
          return new Date(an.expira_em) >= hoje;
        })
        .sort((a, b) => {
          const pesos = { vip: 1, google: 2, proprio: 3 };
          return (pesos[a.tipo] || 99) - (pesos[b.tipo] || 99);
        });

      setPrestadores(filtrados);
      setAnuncios(anunciosOrdenados);
    } catch (err) {
      console.error("Erro na busca:", err);
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
            <div key={p.id} className="bg-white border border-slate-200 px-8 py-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-all shadow-sm group">
              <div className="space-y-2 flex-1">
                <div>
                  <h3 className="font-black text-slate-900 uppercase text-lg leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                    {p.nome || 'Sem Nome'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      {p.categoria || 'Serviços'}
                    </span>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      📍 {p.bairro} • {p.cidades?.nome} - {p.cidades?.estado_sigla}
                    </p>
                  </div>
                </div>

                {p.habilidades && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(Array.isArray(p.habilidades) ? p.habilidades : []).slice(0, 4).map((tag, i) => (
                      <span key={i} className="text-slate-400 text-[9px] font-bold lowercase italic">
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CORREÇÃO DO LINK AQUI */}
              <div className="mt-4 md:mt-0">
                <Link 
                  href={`/${p.slug || p.id}`} 
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all block text-center"
                >
                  Ver Perfil
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <span className="text-4xl block mb-4">🔍</span>
            <h3 className="font-black text-slate-400 uppercase text-xs tracking-[0.2em]">Nenhum profissional encontrado</h3>
            <Link href="/" className="inline-block mt-6 px-8 py-3 bg-slate-100 rounded-2xl text-slate-600 font-black text-[10px] uppercase hover:bg-slate-200 transition-colors">
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
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          
          <div className="flex items-center gap-6 group">
            <Link 
              href="/" 
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <Link href="/" className="transition-transform hover:scale-105">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-12 md:h-14 w-auto object-contain block" 
              />
            </Link>
          </div>

          <Link href="/login" className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-100 transition-all active:scale-95">
            Sou Profissional
          </Link>
        </div>
      </nav>

      <Suspense fallback={<div className="max-w-3xl mx-auto px-4"><CardSkeleton /></div>}>
        <ListaConteudo />
      </Suspense>
    </div>
  )
}
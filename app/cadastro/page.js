'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function ListaConteudo() {
  const searchParams = useSearchParams()
  const queryBusca = searchParams.get('q') || ''

  const [prestadores, setPrestadores] = useState([])
  const [anuncios, setAnuncios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDados()
  }, [queryBusca])

  async function fetchDados() {
    setLoading(true)
    let query = supabase.from('prestadores').select('*')
    
    if (queryBusca) {
      query = query.or(`nome.ilike.%${queryBusca}%,categoria.ilike.%${queryBusca}%,bairro.ilike.%${queryBusca}%`)
    }

    const { data: pData } = await query.order('nome', { ascending: true })
    const { data: aData } = await supabase.from('anuncios').select('*').eq('status', true).eq('posicao', 'topo')

    if (pData) setPrestadores(pData)
    if (aData) setAnuncios(aData)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* EXIBIÇÃO DO BANNER */}
      {anuncios.length > 0 && anuncios.map(anuncio => (
        <div key={anuncio.id} className="mb-8 rounded-[2rem] overflow-hidden border border-slate-100 bg-white">
           {anuncio.link_destino ? (
             <a href={anuncio.link_destino} target="_blank" rel="noopener noreferrer" className="block transition-opacity hover:opacity-90">
                <img src={anuncio.imagem_url} className="w-full h-32 object-cover block" alt={anuncio.titulo} />
             </a>
           ) : (
             <img src={anuncio.imagem_url} className="w-full h-32 object-cover block" alt={anuncio.titulo} />
           )}
        </div>
      ))}

      {/* LISTAGEM */}
      <div className="flex flex-col gap-6">
        {loading ? (
          <p className="text-center py-10 text-slate-300 text-[10px] font-black uppercase tracking-widest animate-pulse">Buscando...</p>
        ) : prestadores.length > 0 ? (
          prestadores.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex items-center justify-between transition-all hover:border-blue-100">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-lg leading-tight">{p.nome || 'Sem Nome'}</h3>
                <p className="text-blue-600 text-[10px] font-black uppercase mt-1">
                    {p.categoria || 'Sem Categoria'} • {p.bairro || 'Bairro'} • {p.cidade || 'Londrina'}
                </p>
                {p.bio && <p className="text-slate-500 text-[10px] mt-2 normal-case leading-relaxed">{p.bio}</p>}
              </div>
              <a href={`https://wa.me/${p.whatsapp?.replace(/\D/g, '')}`} target="_blank" className="bg-green-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                WhatsApp
              </a>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.4em]">Nenhum profissional encontrado</h3>
            <Link href="/" className="inline-block mt-6 text-blue-600 font-black text-[10px] uppercase underline">Voltar</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ListaPrestadores() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <nav className="bg-white border-b border-slate-100 py-6 mb-10 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
          
          <div className="flex items-center gap-6">
            {/* LINK INICIO COM SETA À ESQUERDA */}
            <Link 
              href="/" 
              className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-blue-600 transition-colors"
            >
              <span className="text-xs">←</span>
              <span>Inicio</span>
            </Link>

            <Link href="/">
              <img src="/logo.png" alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
            </Link>
          </div>

          <Link href="/login" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">
            Sou Profissional
          </Link>
        </div>
      </nav>

      <Suspense fallback={<p className="text-center py-10">Carregando busca...</p>}>
        <ListaConteudo />
      </Suspense>
    </div>
  )
}
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
    // Dentro da função fetchDados(), substitua a linha do aData por esta:
    const { data: aData } = await supabase
      .from('anuncios')
      .select('*')
      .eq('status', true)
      .eq('posicao', 'topo') // Garante que só pegamos anúncios do topo aqui
      .order('created_at', { ascending: false });

    if (pData) setPrestadores(pData)
    if (aData) setAnuncios(aData)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
    {/* EXIBIÇÃO DO BANNER - TOTALMENTE LIMPO */}
      {anuncios.length > 0 && anuncios.map(anuncio => (
        <div key={anuncio.id} className="mb-8 rounded-[2rem] overflow-hidden">
          <img src={anuncio.imagem_url} className="w-full h-32 object-cover block" alt="Destaque" />
        </div>
      ))}

      {/* LISTAGEM */}
      <div className="flex flex-col gap-6">
        {loading ? (
          <p className="text-center py-10 text-slate-300 text-[10px] font-black uppercase tracking-widest animate-pulse">Buscando...</p>
        ) : prestadores.length > 0 ? (
          prestadores.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 uppercase text-lg leading-tight">
                    {p.nome || 'Sem Nome'}
                </h3>
                {/* ADICIONADA A CIDADE AQUI */}
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
          /* MENSAGEM VAZIA - CINZA */
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.4em]">
                Nenhum profissional encontrado
            </h3>
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
          
          <div className="flex items-center gap-4">
            {/* BOTÃO VOLTAR - Discreto e funcional */}
            <Link 
              href="/" 
              className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
              title="Voltar para a página inicial"
            >
              <span className="text-xl">←</span>
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
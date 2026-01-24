'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function PerfilPublico() {
  const params = useParams()
  const [prestador, setPrestador] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarPerfil() {
      if (!params.slug) return;
      let query = supabase.from('prestadores').select('*, cidades(nome, estado_sigla)');
      
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-.../.test(params.slug); 
      
      if (isUUID) {
        query = query.eq('id', params.slug);
      } else {
        query = query.eq('slug', params.slug);
      }

      const { data, error } = await query.single();
      if (!error) setPrestador(data);
      setLoading(false);
    }
    carregarPerfil();
  }, [params.slug]);

  const compartilharPerfil = () => {
    const shareData = {
      title: `Procuro Quem Faça - ${prestador?.nome}`,
      text: `Confira o trabalho de ${prestador?.nome} (${prestador?.categoria}) em ${prestador?.cidades?.nome}.`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`, '_blank');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  if (!prestador) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-black text-slate-200 uppercase italic mb-4">Perfil não encontrado</h1>
      <Link href="/" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Voltar para a Vitrine</Link>
    </div>
  )

  const waLink = `https://wa.me/55${prestador.whatsapp.replace(/\D/g, '')}?text=Olá ${prestador.nome}, vi seu perfil no Procuro Quem Faça e gostaria de um orçamento.`

  return (
    <main className="min-h-screen bg-white font-sans text-slate-800">
      {/* NAV GLASSMORPHISM */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <Link href="/" className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-90 font-black">←</Link>
          <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
          <button onClick={compartilharPerfil} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm transition-all active:scale-90">
             <span className="text-lg">🔗</span>
          </button> 
        </div>
      </nav>

      <div className="max-w-xl mx-auto pt-24 pb-12 px-6">
        {/* HEADER HERO */}
        <section className="text-center mb-10">
          <div className="relative inline-block">
            <div className="w-36 h-36 rounded-[3rem] bg-slate-100 mx-auto mb-6 overflow-hidden ring-8 ring-slate-50 shadow-2xl">
              <img src={prestador.foto_perfil} className="w-full h-full object-cover" alt={prestador.nome} />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-2xl shadow-xl border-4 border-white">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>

          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3 italic">{prestador.nome}</h1>
          
          <div className="flex flex-col items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-blue-100">
              {prestador.categoria}
            </span>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mt-2 italic">
               📍 {prestador.bairro}, {prestador.cidades?.nome}
            </p>
          </div>
        </section>

        {/* CONTEÚDO EM FLUXO NORMAL */}
        <div className="space-y-6">
          
          {/* 1. ESPECIALIDADES */}
          <section className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50 shadow-inner">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 italic underline underline-offset-4 decoration-blue-200">Especialidades</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase italic shadow-sm">
                {prestador.categoria}
              </span>
              {prestador.habilidades?.map(hab => (
                <span key={hab} className="px-4 py-2 bg-white border border-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase italic shadow-sm">
                  {hab}
                </span>
              ))}
            </div>
          </section>

          {/* 2. SOBRE O PROFISSIONAL */}
          <section className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50 shadow-inner">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 italic underline underline-offset-4 decoration-blue-200">Sobre o Profissional</h2>
            <p className="text-slate-600 text-[15px] font-medium leading-relaxed not-italic mb-6">
              {prestador.bio || "Este profissional é verificado e está pronto para atender sua solicitação."}
            </p>
            
            <div className="flex flex-wrap gap-2">
              {prestador.tags?.map(tag => (
                <span key={tag} className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm">
                  #{tag.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </section>

          {/* 3. BOTÃO SOLICITAR ORÇAMENTO (AGORA NO FLUXO, ABAIXO DO SOBRE) */}
          <div className="pt-2">
            <a 
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-[0_15px_30px_rgba(37,99,235,0.2)] hover:bg-blue-700 hover:shadow-none transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Solicitar Orçamento
            </a>
          </div>

        </div>
      </div>
    </main>
  )
}
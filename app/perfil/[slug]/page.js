'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'

function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-white font-sans text-slate-800">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 h-20 border-b border-slate-100/50" />
      
      <div className="max-w-xl mx-auto pt-32 pb-12 px-6 animate-pulse">
        <div className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100" />
          {/* Ajuste de margem no Skeleton para alinhar com o real */}
          <div className="h-8 bg-slate-100 rounded-lg w-3/4 mb-3 mt-6" />
          <div className="h-4 bg-slate-50 rounded-lg w-1/2" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-slate-50 rounded-[2.5rem]" />
          <div className="h-40 bg-slate-50 rounded-[2.5rem]" />
        </div>
      </div>
    </main>
  )
}

export default function PerfilPublico() {
  const params = useParams()
  const router = useRouter()
  const [prestador, setPrestador] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [urlRetorno, setUrlRetorno] = useState('/prestadores')

  const registrarLog = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert({
        acao,
        entidade_tipo: 'prestador',
        entidade_id: prestador?.id,
        detalhes: { ...detalhes, nome_prestador: prestador?.nome }
      })
    } catch (err) {
      console.error('Erro log:', err)
    }
  }

  useEffect(() => {
    setIsMounted(true)

    async function carregarPerfil() {
      if (!params?.slug) return;
      
      let query = supabase.from('prestadores').select('*, cidades(nome, estado_sigla)');
      
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(params.slug); 
      if (isUUID) {
        query = query.eq('id', params.slug);
      } else {
        query = query.eq('slug', params.slug);
      }

      const { data, error } = await query.single();
      
      if (!error && data) {
        setPrestador(data);
        if (data.categoria) {
            setUrlRetorno(`/prestadores?categoria=${encodeURIComponent(data.categoria)}`);
        }
      }
      setLoading(false);
    }
    carregarPerfil();
  }, [params.slug]);

  const compartilharPerfil = () => {
    registrarLog('COMPARTILHAR_PERFIL_CLIQUE');
    const shareData = {
      title: `Procuro Quem Faça - ${prestador?.nome}`,
      text: `Confira o trabalho de ${prestador?.nome} (${prestador?.categoria}) em ${prestador?.cidades?.nome}.`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + shareData.url)}`, '_blank');
    }
  };

  if (!isMounted || loading) {
    return <PerfilSkeleton />
  }

  if (!prestador) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col items-center justify-center p-6 text-center">
        <Header href="/" />
        <div className="pt-24">
            <h3 className="text-2xl font-bold text-slate-400 uppercase italic mb-4">Perfil não encontrado</h3>
            <Link href="/" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Voltar para a Vitrine</Link>
        </div>
      </main>
    )
  }

  const waLink = `https://wa.me/55${prestador.whatsapp.replace(/\D/g, '')}?text=Olá ${prestador.nome}, vi seu perfil no Procuro Quem Faça e gostaria de um orçamento.`;
  const isPublico = prestador.origem_tipo === 'curadoria_publica';

  return (
    <main className="min-h-screen bg-white font-sans text-slate-800">
      <Header href={urlRetorno !== '/prestadores' ? urlRetorno : undefined} />

      <div className="max-w-xl mx-auto pt-28 md:pt-36 pb-12 px-6 animate-in fade-in duration-500">
        <section className="text-center mb-10 relative">
          
          <Link 
            href={`/denunciar/${prestador.id}`}
            className="absolute top-0 left-0 z-10 w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </Link>

          <button 
            onClick={compartilharPerfil} 
            className="absolute top-0 right-0 z-10 w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>

          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400">
              {prestador.foto_perfil ? (
                <img src={prestador.foto_perfil} className="w-full h-full object-cover" alt={prestador.nome} />
              ) : (
                <span className="text-slate-300 font-black text-[10px] uppercase">Sem Foto</span>
              )}
            </div>
            
            {prestador.verificado && !isPublico && (
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-2xl shadow-xl border-4 border-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
          </div>

          {/* AJUSTE PRECITO: mt-6 adicionado para respiro visual */}
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight leading-none mb-3 mt-6 italic">
            {prestador.nome}
          </h1>

          <div className="flex flex-col items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-lg shadow-blue-100">
              {prestador.categoria}
            </span>
            <p className="text-slate-400 text-[11px] font-medium uppercase tracking-[0.1em] mt-1 italic">
                📍 {prestador.bairro}, {prestador.cidades?.nome}
            </p>
          </div>
        </section>

        {isPublico && (
          <Link 
              href={`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`}
              className="block mb-8 bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] group hover:bg-indigo-600 transition-all duration-300 active:scale-[0.98]"
          >
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">🤝</div>
                  <div className="text-left">
                      <h4 className="text-indigo-900 font-black uppercase text-[10px] italic group-hover:text-white transition-colors">Este é o seu perfil?</h4>
                      <p className="text-indigo-700/70 text-[9px] font-bold uppercase leading-tight group-hover:text-white/80 transition-colors">Reivindique agora para editar suas informações.</p>
                  </div>
              </div>
          </Link>
        )}

        <div className="space-y-6">
          {prestador.habilidades && prestador.habilidades.length > 0 && (
            <section className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50 shadow-inner">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 underline underline-offset-4 decoration-blue-200">Especialidades</h2>
              <div className="flex flex-wrap gap-2">
                {prestador.habilidades.map(hab => (
                  <span key={hab} className="px-4 py-2 bg-white border border-slate-100 text-slate-500 rounded-xl text-[10px] font-bold uppercase shadow-sm">
                    {hab}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50 shadow-inner">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 underline underline-offset-4 decoration-blue-200">Sobre o Profissional</h2>
            <p className="text-slate-600 text-sm font-normal leading-relaxed">
              {prestador.bio || "Informações coletadas via curadoria pública. Este profissional ainda não personalizou sua biografia."}
            </p>
          </section>

          <div className="pt-2">
            <a 
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarLog('CLIQUE_WHATSAPP_ORCAMENTO')}
              className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_15px_30px_rgba(37,99,235,0.2)] hover:bg-blue-700 hover:shadow-none transition-all active:scale-[0.98] italic"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Solicitar Orçamento
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
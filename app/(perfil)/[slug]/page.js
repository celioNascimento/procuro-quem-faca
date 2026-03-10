'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import PortfolioGrid from '@/components/profile/PortfolioGrid'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle, Loader2 } from 'lucide-react'

// ── Skeleton ────────────────────────────────────────────────────────────────
function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-white font-sans">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 h-20 border-b border-slate-100/50" />
      <div className="max-w-xl mx-auto pt-32 pb-12 px-6 animate-pulse">
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="w-28 h-28 rounded-[2rem] bg-slate-100" />
          <div className="h-7 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-50 rounded-lg w-1/3" />
        </div>
        <div className="space-y-4">
          <div className="h-28 bg-slate-50 rounded-[2rem]" />
          <div className="grid grid-cols-3 gap-3">
            {[1,2,3].map(i => <div key={i} className="aspect-square bg-slate-50 rounded-2xl" />)}
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function PerfilPublico() {
  const params = useParams()
  const router = useRouter()
  const [prestador, setPrestador] = useState(null)
  const [projetos, setProjetos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [urlRetorno, setUrlRetorno] = useState('/prestadores')
  const [compartilhando, setCompartilhando] = useState(false)

  // ── Log de atividade ──────────────────────────────────────────────────────
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

  // ── Carregamento ──────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMounted(true)

    async function carregarPerfil() {
      if (!params?.slug) return

      let query = supabase.from('prestadores').select(`
        *,
        cidades(nome, estado_sigla),
        portfolio_projetos(
          id, titulo, descricao, status,
          portfolio_fotos(url_foto, ordem, legenda)
        )
      `)

      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(params.slug)
      query = isUUID ? query.eq('id', params.slug) : query.eq('slug', params.slug)

      const { data, error } = await query.single()

      if (!error && data) {
        setPrestador(data)

        // Vitrine: em_execucao (prova de atividade) + finalizado — oculta em_registro e pendente
        const projetosFiltrados = (data.portfolio_projetos || [])
          .filter(p => ['em_execucao', 'finalizado'].includes(p.status))
          .sort((a, b) => {
            if (a.status === 'finalizado' && b.status !== 'finalizado') return -1
            if (a.status !== 'finalizado' && b.status === 'finalizado') return 1
            return 0
          })

        setProjetos(projetosFiltrados)

        if (data.categoria) {
          setUrlRetorno(`/prestadores?categoria=${encodeURIComponent(data.categoria)}`)
        }
      }
      setLoading(false)
    }

    carregarPerfil()
  }, [params?.slug])

  // ── Compartilhar ──────────────────────────────────────────────────────────
  const compartilharPerfil = async () => {
    registrarLog('COMPARTILHAR_PERFIL_CLIQUE')
    setCompartilhando(true)
    setTimeout(() => setCompartilhando(false), 1500)

    const url = typeof window !== 'undefined' ? window.location.href : ''
    const texto = `Confira o trabalho de ${prestador?.nome} no Procuro Quem Faça.`

    if (navigator.share) {
      try { await navigator.share({ title: prestador?.nome, text: texto, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      window.open(`https://wa.me/?text=${encodeURIComponent(texto + ' ' + url)}`, '_blank')
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isMounted || loading) return <PerfilSkeleton />

  if (!prestador) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col items-center justify-center p-6 text-center">
        <Header href="/" />
        <div className="pt-24 space-y-6">
          <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Perfil não encontrado</h3>
          <Link href="/" className="inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            Voltar para a Vitrine
          </Link>
        </div>
      </main>
    )
  }

  // ── Derivações ────────────────────────────────────────────────────────────
  const waLink = `https://wa.me/55${prestador.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${prestador.nome}, vi seu perfil no Procuro Quem Faça e gostaria de um orçamento.`)}`
  const isPublico = prestador.origem_tipo === 'curadoria_publica'

  const localizacao = [prestador.bairro, prestador.cidades?.nome]
    .filter(v => v?.trim())
    .join(', ')

  const totalFinalizados = projetos.filter(p => p.status === 'finalizado').length
  const totalEmAndamento = projetos.filter(p => p.status === 'em_execucao').length

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      <Header href={urlRetorno !== '/prestadores' ? urlRetorno : undefined} />

      <div className="max-w-xl mx-auto pt-24 md:pt-32 pb-16 px-5 animate-in fade-in duration-500">

        {/* ── Hero do prestador ── */}
        <section className="relative mb-8">

          {/* Botões de ação — cantos opostos, discretos */}
          <div className="flex justify-between items-start mb-6">
            <Link
              href={`/denunciar/${prestador.id}`}
              title="Denunciar este perfil"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-semibold text-slate-400 shadow-sm hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
            >
              <Flag size={12} />
              Denunciar
            </Link>

            <button
              onClick={compartilharPerfil}
              title="Compartilhar perfil"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-semibold text-slate-400 shadow-sm hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
            >
              {compartilhando
                ? <><CheckCircle size={12} className="text-green-500" /> Copiado!</>
                : <><Share2 size={12} /> Compartilhar</>
              }
            </button>
          </div>

          {/* Foto + identidade */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="relative">
              <div className="w-28 h-28 rounded-[2rem] bg-slate-100 overflow-hidden border-4 border-white shadow-xl">
                {prestador.foto_perfil
                  ? <img src={prestador.foto_perfil} className="w-full h-full object-cover" alt={prestador.nome} />
                  : <span className="w-full h-full flex items-center justify-center text-slate-300 font-black text-[9px] uppercase tracking-widest">Sem Foto</span>
                }
              </div>
              {prestador.verificado && (
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                  <ShieldCheck size={13} strokeWidth={3} />
                </div>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight leading-none">
                {prestador.nome}
              </h1>
              {prestador.categoria && (
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">
                  {prestador.categoria}
                </p>
              )}
              {localizacao && (
                <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400 mt-1.5">
                  <MapPin size={11} /> {localizacao}
                </p>
              )}
            </div>

            {/* Badges de atividade */}
            {(totalFinalizados > 0 || totalEmAndamento > 0) && (
              <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
                {totalFinalizados > 0 && (
                  <span className="px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    ✓ {totalFinalizados} {totalFinalizados === 1 ? 'concluído' : 'concluídos'}
                  </span>
                )}
                {totalEmAndamento > 0 && (
                  <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    ● em andamento
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Banner de reivindicação ── */}
        {isPublico && (
          <Link
            href={`/reivindicar?id=${prestador.id}&nome=${encodeURIComponent(prestador.nome)}`}
            className="flex items-center gap-4 mb-6 bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] group hover:bg-indigo-600 transition-all duration-300 active:scale-[0.98]"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0 group-hover:scale-110 transition-transform">🤝</div>
            <div>
              <p className="text-indigo-900 font-black uppercase text-[10px] italic group-hover:text-white transition-colors">Este é o seu perfil?</p>
              <p className="text-indigo-600/70 text-[9px] font-semibold uppercase leading-tight group-hover:text-white/80 transition-colors">Reivindique agora para editar suas informações.</p>
            </div>
          </Link>
        )}

        <div className="space-y-4">

          {/* ── Sobre ── */}
          <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">Sobre o Profissional</h2>
            <p className="text-slate-600 text-[14px] leading-relaxed">
              {prestador.bio || 'Informações coletadas via curadoria pública. Este profissional ainda não personalizou sua biografia.'}
            </p>
          </section>

          {/* ── Especialidades ── */}
          {prestador.habilidades?.length > 0 && (
            <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">Especialidades</h2>
              <div className="flex flex-wrap gap-2">
                {prestador.habilidades.map(hab => (
                  <span key={hab} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm">
                    {hab}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Portfólio ── */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-1">
              Registros de Atividade
            </h2>
            <PortfolioGrid projetos={projetos} />
          </section>

          {/* ── CTA WhatsApp ── */}
          <div className="pt-2">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarLog('CLIQUE_WHATSAPP_ORCAMENTO')}
              className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all italic"
            >
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
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
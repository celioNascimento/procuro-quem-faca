'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import PortfolioGrid from '@/components/profile/PortfolioGrid'
import { MapPin, ShieldCheck, Flag, Share2, CheckCircle } from 'lucide-react'

// ── Helpers de cookie ─────────────────────────────────────────────────────────

function setCookie(name, value, days = 30) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PerfilSkeleton() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans">
      <Header href="/prestadores" />
      <div className="max-w-xl mx-auto pt-24 md:pt-32 pb-12 px-6 animate-pulse">
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="w-28 h-28 rounded-[2rem] bg-slate-100" />
          <div className="h-7 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-4 bg-slate-50 rounded-lg w-1/3" />
        </div>
        <div className="space-y-4">
          <div className="h-28 bg-slate-50 rounded-[2rem]" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="aspect-square bg-slate-50 rounded-2xl" />)}
          </div>
        </div>
      </div>
    </main>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function PerfilPublico() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const [prestador, setPrestador] = useState(null)
  const [projetos, setProjetos]   = useState([])
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading]     = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  const fromParam        = searchParams?.get('from')
  const srcParam         = searchParams?.get('src')   // ?src=ativacao
  const urlRetornoInicial = fromParam ? decodeURIComponent(fromParam) : '/prestadores'
  const [urlRetorno, setUrlRetorno] = useState(urlRetornoInicial)
  const [compartilhando, setCompartilhando] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const ctaRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    )
    if (ctaRef.current) observer.observe(ctaRef.current)
    return () => observer.disconnect()
  }, [])

  // ── Log de atividade ───────────────────────────────────────────────────────

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

  // ── Rastreamento pós-ativação ──────────────────────────────────────────────
  // Roda assim que prestador está disponível — uma única vez por perfil/sessão

  useEffect(() => {
    if (!prestador) return

    const slug       = prestador.slug || String(prestador.id)
    const cookieKey  = `ativacao_visita_${slug}`
    const jaRegistrou = getCookie(cookieKey)

    // 1. Veio direto do link do WhatsApp (?src=ativacao) — log imediato
    if (srcParam === 'ativacao' && !jaRegistrou) {
      setCookie(cookieKey, 'ativacao', 7)   // expira em 7 dias
      supabase.from('logs_atividades').insert({
        acao: 'VISITA_POS_ATIVACAO',
        entidade_tipo: 'prestador',
        entidade_id: prestador.id,
        detalhes: {
          nome_prestador: prestador.nome,
          slug,
          origem: 'link_whatsapp',
          src: 'ativacao',
        }
      }).then(({ error }) => {
        if (error) console.error('[log ativacao]', error)
        else console.log('[log ativacao] visita registrada para', prestador.nome)
      })
      return
    }

    // 2. Não veio pelo link mas tem cookie — retornou ao perfil depois
    if (!srcParam && jaRegistrou === 'ativacao') {
      supabase.from('logs_atividades').insert({
        acao: 'RETORNO_POS_ATIVACAO',
        entidade_tipo: 'prestador',
        entidade_id: prestador.id,
        detalhes: {
          nome_prestador: prestador.nome,
          slug,
          origem: 'retorno_cookie',
        }
      }).then(({ error }) => {
        if (!error) console.log('[log ativacao] retorno registrado para', prestador.nome)
      })
    }
  }, [prestador, srcParam])

  // ── Carregamento ───────────────────────────────────────────────────────────

  useEffect(() => {
    setIsMounted(true)

    async function carregarPerfil() {
      if (!params?.slug) return

      let query = supabase.from('prestadores').select(`
        *,
        cidades(nome, estado_sigla),
        categorias(nome),
        portfolio_projetos(
          id, titulo, descricao, status, created_at,
          portfolio_fotos(url_foto, ordem, legenda),
          avaliacoes(id, indica)
        )
      `)

      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/.test(params.slug)
      query = isUUID ? query.eq('id', params.slug) : query.eq('slug', params.slug)

      const { data, error } = await query.single()

      if (!error && data) {
        setPrestador(data)

        const projetosFiltrados = (data.portfolio_projetos || [])
          .filter(p => ['em_execucao', 'finalizado'].includes(p.status))
          .sort((a, b) => {
            if (a.status === b.status) return new Date(b.created_at || 0) - new Date(a.created_at || 0)
            return a.status === 'finalizado' ? -1 : 1
          })

        setProjetos(projetosFiltrados)

        const { data: avalData } = await supabase
          .from('avaliacoes')
          .select('id, nota, comentario, indica, created_at')
          .eq('prestador_id', data.id)
          .eq('visivel', true)
          .order('created_at', { ascending: false })
          .limit(10)
        setAvaliacoes(avalData || [])

        if (!fromParam) {
          const nomeCategoria = data.categorias?.nome || data.categoria
          if (nomeCategoria) setUrlRetorno(`/prestadores?q=${encodeURIComponent(nomeCategoria)}`)
        }
      }

      setLoading(false)
    }

    carregarPerfil()
  }, [params?.slug])

  // ── Compartilhar ───────────────────────────────────────────────────────────

  const compartilharPerfil = async () => {
    registrarLog('COMPARTILHAR_PERFIL_CLIQUE')
    const url   = typeof window !== 'undefined' ? window.location.href : ''
    const texto = `Confira o trabalho de ${prestador?.nome} no Procuro Quem Faça.`
    if (navigator.share) {
      try { await navigator.share({ title: prestador?.nome, text: texto, url }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(url) } catch {}
    }
    setCompartilhando(true)
    setTimeout(() => setCompartilhando(false), 1500)
  }

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (!isMounted || loading) return <PerfilSkeleton />

  if (!prestador) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] font-sans flex flex-col items-center justify-center p-6 text-center">
        <Header href="/prestadores" />
        <div className="pt-24 space-y-6">
          <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Perfil não encontrado</h3>
          <Link href="/prestadores" className="inline-block px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
            Ver Profissionais
          </Link>
        </div>
      </main>
    )
  }

  // ── Derivações ─────────────────────────────────────────────────────────────

  const temWhatsapp = !!prestador.whatsapp?.replace(/\D/g, '')
  const waLink = temWhatsapp
    ? `https://wa.me/55${prestador.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${prestador.nome}, vi seu perfil no Procuro Quem Faça e gostaria de um orçamento.`)}`
    : null

  const isPublico = prestador.origem_tipo === 'curadoria_publica'
  const localizacao = [prestador.bairro, prestador.cidades?.nome].filter(v => v?.trim()).join(', ')
  const totalFinalizados  = projetos.filter(p => p.status === 'finalizado').length
  const totalEmAndamento  = projetos.filter(p => p.status === 'em_execucao').length

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      <Header href={urlRetorno} />

      <div className="max-w-xl mx-auto pt-24 md:pt-32 pb-16 px-5 animate-in fade-in duration-500">

        {/* ── Hero ── */}
        <section className="relative mb-4">
          <div className="flex justify-between items-start mb-6">
            <Link
              href={`/denunciar/${prestador.id}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-semibold text-slate-400 shadow-sm hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
            >
              <Flag size={12} />
              Denunciar
            </Link>
            <button
              onClick={compartilharPerfil}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-100 rounded-full text-[10px] font-semibold text-slate-400 shadow-sm hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95"
            >
              {compartilhando
                ? <><CheckCircle size={12} className="text-green-500" /> Copiado!</>
                : <><Share2 size={12} /> Compartilhar</>
              }
            </button>
          </div>

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
              {(prestador.categorias?.nome || prestador.categoria) && (
                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">
                  {prestador.categorias?.nome || prestador.categoria}
                </p>
              )}
              {localizacao && (
                <p className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-400 mt-1.5">
                  <MapPin size={11} /> {localizacao}
                </p>
              )}
            </div>

            {(totalFinalizados > 0 || totalEmAndamento > 0) && (
              <div className="flex items-center gap-2 flex-wrap justify-center mt-1">
                {totalFinalizados > 0 && (
                  <span className="px-3 py-1.5 bg-green-50 border border-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    ✓ {totalFinalizados} {totalFinalizados === 1 ? 'concluído' : 'concluídos'}
                  </span>
                )}
                {totalEmAndamento > 0 && (
                  <span className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    ● {totalEmAndamento} em andamento
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Banner reivindicação ── */}
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
          {(prestador.habilidades?.length ?? 0) > 0 && (
            <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">Especialidades</h2>
              <div className="flex flex-wrap gap-2">
                {(prestador.habilidades || []).map(hab => (
                  <span key={hab} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm">
                    {hab}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── CTA WhatsApp ── */}
          {waLink && (
            <div ref={ctaRef} className="pt-2">
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
          )}

          {/* ── Portfólio ── */}
          <section className="space-y-3">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-1">
              Registros de Atividade
            </h2>
            <PortfolioGrid projetos={projetos} />
          </section>

          {/* ── Avaliações ── */}
          {avaliacoes.length > 0 && (() => {
            const totalIndica = avaliacoes.filter(a => a.indica).length
            const mediaNotas  = (avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length).toFixed(1)
            return (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Avaliações</h2>
                  <div className="flex items-center gap-3">
                    {totalIndica > 0 && (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[9px] font-black tracking-wide px-2.5 py-1 rounded-full border border-blue-100">
                        ✦ {totalIndica} {totalIndica === 1 ? 'indicação' : 'indicações'}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-slate-500">
                      ★ {mediaNotas} · {avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {avaliacoes.map(av => (
                    <div key={av.id} className="bg-white rounded-[2rem] p-5 border border-slate-100 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`text-[13px] ${av.nota >= s ? 'text-blue-600' : 'text-slate-200'}`}>★</span>
                          ))}
                        </div>
                        {av.indica && (
                          <span className="flex items-center gap-1 bg-blue-600 text-white text-[8px] font-black tracking-wide px-2.5 py-1 rounded-full shrink-0">
                            ✦ Indico
                          </span>
                        )}
                      </div>
                      {av.comentario && (
                        <p className="text-[12px] font-medium text-slate-600 leading-relaxed italic">
                          "{av.comentario}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          })()}

        </div>
      </div>

      {/* ── FAB WhatsApp ── */}
      {waLink && scrolled && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => registrarLog('CLIQUE_WHATSAPP_ORCAMENTO')}
          className="fixed bottom-6 right-5 z-50 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-300 hover:bg-blue-700 active:scale-90 transition-all animate-in zoom-in-50 duration-300"
          aria-label="Solicitar Orçamento via WhatsApp"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </main>
  )
}
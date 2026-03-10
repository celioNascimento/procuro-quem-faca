'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  Clock, CheckCircle2, ChevronRight, User, Smartphone,
  LayoutGrid, ShieldCheck, Search, Phone, LogIn, ExternalLink, X, ZoomIn, Briefcase, MapPin
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PainelDoCliente() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoomImage, setZoomImage] = useState(null)
  const [tokenUrl, setTokenUrl] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      setTokenUrl(searchParams.get('token'))
    }
  }, [])

  const loginComGoogle = async () => {
    const redirectUrl = tokenUrl
      ? `${window.location.origin}/meus-servicos?token=${tokenUrl}`
      : `${window.location.origin}/meus-servicos`

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl }
    })
  }

  const handleAceiteTecnico = async (servico) => {
    try {
      const nomeCorreto = profile?.full_name || session?.user?.user_metadata?.full_name || servico.cliente_nome

      const { error } = await supabase
        .from('portfolio_projetos')
        .update({
          status: 'em_execucao',
          aceito_at: new Date().toISOString(),
          cliente_nome: nomeCorreto
        })
        .eq('id', servico.id)

      if (error) {
        console.error('Erro ao atualizar status:', error)
        return
      }

      window.location.href = `/avaliar/${servico.id}?token=${servico.avaliacao_token}`
    } catch (err) {
      console.error('Falha na comunicação:', err)
    }
  }

  const buscarDados = async (user, token) => {
    setLoading(true)
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      setProfile(prof)

      let projs = []

      // ── PRIORIDADE 1: buscar pelo token da URL ─────────────────────────────
      // É a forma mais confiável — não depende de WhatsApp no perfil do cliente.
      if (token) {
        const { data } = await supabase
          .from('portfolio_projetos')
          .select(`
            *,
            prestadores (nome, foto_perfil, whatsapp, categoria:categorias(nome)),
            portfolio_fotos (*)
          `)
          .eq('avaliacao_token', token)
          .eq('status', 'pendente')
          .maybeSingle()

        if (data) projs = [data]
      }

      // ── PRIORIDADE 2: fallback por WhatsApp (cliente já logado sem token) ──
      // Útil quando o cliente volta à página sem o token na URL.
      if (projs.length === 0) {
        const whatsapp = prof?.whatsapp || localStorage.getItem('cliente_whatsapp')
        if (whatsapp) {
          const { data } = await supabase
            .from('portfolio_projetos')
            .select(`
              *,
              prestadores (nome, foto_perfil, whatsapp, categoria:categorias(nome)),
              portfolio_fotos (*)
            `)
            .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
            .eq('status', 'pendente')
            .order('created_at', { ascending: false })

          if (data) projs = data
        }
      }

      if (projs.length > 0) {
        setServicos(projs)
      } else {
        router.push('/painel/perfil')
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
      router.push('/painel/perfil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Aguarda tokenUrl ser lido antes de buscar
    if (tokenUrl === null) return

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) buscarDados(session.user, tokenUrl)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) buscarDados(session.user, tokenUrl)
    })

    return () => subscription.unsubscribe()
  }, [tokenUrl]) // depende de tokenUrl para garantir que o token já foi lido

  // ── Avatar com fallback para iniciais ─────────────────────────────────────
  const avatarUrl = profile?.avatar_url || session?.user?.user_metadata?.avatar_url
  const nomeCliente = profile?.full_name || session?.user?.user_metadata?.full_name || ''
  const iniciais = nomeCliente.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-12 h-12 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  if (!session) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">

        <div className="flex justify-center mb-4">
          <Link href="/" className="transition-transform active:scale-95 duration-300 flex justify-center">
            <img
              src="/logo.png"
              alt="Logo Procuro Quem Faça"
              className="h-10 md:h-12 w-auto object-contain drop-shadow-sm"
            />
          </Link>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] border border-slate-50 text-center space-y-8">

          {tokenUrl ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-6">
                <Briefcase size={32} />
              </div>
              <h2 className="text-2xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">Projeto<br/>Identificado</h2>
              <p className="text-xs font-medium text-slate-500 leading-relaxed px-2">
                Para sua segurança, confirme sua identidade Google para vincular este projeto à sua conta.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-6">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">Portal do<br/>Cliente</h2>
              <p className="text-xs font-medium text-slate-500 leading-relaxed px-4">
                Acesse seus contratos e acompanhe serviços em tempo real com segurança.
              </p>
            </div>
          )}

          <button
            onClick={loginComGoogle}
            className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black italic uppercase text-[12px] md:text-sm tracking-widest text-center hover:bg-blue-700 transition-all active:scale-[0.98] shadow-2xl shadow-blue-200/60"
          >
            Acessar com Google
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 pb-32 font-sans antialiased selection:bg-blue-100">

      {zoomImage && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setZoomImage(null)}
        >
          <button className="absolute top-6 right-6 text-white/70 bg-white/10 p-3 rounded-full hover:bg-white/20 hover:text-white transition-all">
            <X size={24} />
          </button>
          <img
            src={zoomImage}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 ring-1 ring-white/10"
            alt="Zoom do Registro"
          />
          <p className="absolute bottom-12 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Toque para fechar</p>
        </div>
      )}

      <div className="max-w-xl mx-auto px-6 pt-6 space-y-6">

        {/* ── HEADER REDESENHADO ────────────────────────────────────────────── */}
        <header className="relative flex flex-col items-center gap-2 pb-4 border-b border-slate-100">

          {/* Logo centralizada — elemento principal da identidade */}
          <Link href="/" className="transition-transform active:scale-95 duration-300 flex items-center">
            <img src="/logo.png" alt="Procuro Quem Faça" className="h-8 w-auto object-contain drop-shadow-sm" />
          </Link>

          {/* Linha de perfil: avatar + nome completo à esquerda, botão sair à direita */}
          <div className="w-full flex items-center justify-between gap-4">

            {/* Avatar + nome — sem truncamento, nome completo em duas linhas se precisar */}
            <button
              onClick={() => router.push('/painel/perfil')}
              className="flex items-center gap-3 group text-left"
            >
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-blue-500 blur-md opacity-0 group-hover:opacity-20 transition-opacity rounded-full" />
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    className="relative w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
                    alt="Avatar"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div
                  className="relative w-11 h-11 rounded-full bg-blue-600 border-2 border-white shadow-md items-center justify-center text-white font-black text-xs"
                  style={{ display: avatarUrl ? 'none' : 'flex' }}
                >
                  {iniciais || <User size={16} />}
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Conectado como
                </p>
                {/* Nome completo — quebra linha, sem corte */}
                <p className="text-sm font-black text-slate-800 uppercase italic leading-tight break-words">
                  {nomeCliente || 'Cliente'}
                </p>
              </div>
            </button>

            {/* Botão sair — explícito, sem ambiguidade */}
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/')
              }}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </header>

        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase text-slate-800 leading-[0.9] tracking-tighter">
            Projetos<br /><span className="text-blue-600">Pendentes</span>
          </h1>
          <p className="text-[11px] font-medium text-slate-500 pl-1">
            Você tem <span className="font-bold text-slate-800">{servicos.length}</span> {servicos.length === 1 ? 'projeto aguardando' : 'projetos aguardando'} aprovação.
          </p>
        </div>

        <div className="space-y-8">
          {servicos.map((servico) => {
            const fotoInicio = servico.portfolio_fotos?.find(f => f.ordem === 1)
            return (
              <div key={servico.id} className="bg-white rounded-[2.5rem] p-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-50 group">
                <div className="flex items-center justify-between px-2 mb-4">
                  <div className="flex items-center gap-3">
                    {servico.prestadores?.foto_perfil ? (
                      <img src={servico.prestadores.foto_perfil} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-50" alt="Prestador" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <User size={18} className="text-slate-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Prestador</p>
                      <h3 className="text-xs font-black uppercase text-slate-800">{servico.prestadores?.nome}</h3>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                      {servico.prestadores?.categoria?.nome || 'Serviço'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => fotoInicio && setZoomImage(fotoInicio.url_foto)}
                  className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 cursor-zoom-in"
                >
                  {fotoInicio ? (
                    <>
                      <img src={fotoInicio.url_foto} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Início" />
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-1.5">
                          <Clock size={10} className="text-blue-600" /> Aguardando Início
                        </p>
                      </div>
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/30 backdrop-blur-md p-4 rounded-full text-white border border-white/40">
                          <ZoomIn size={24} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                      <Briefcase size={32} opacity={0.5} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Sem foto de capa</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 px-2 space-y-5">
                  <div>
                    <h4 className="text-xl font-black italic uppercase text-slate-800 leading-tight tracking-tight line-clamp-2">
                      {servico.titulo}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 text-slate-400">
                      <Clock size={12} />
                      <p className="text-[10px] font-medium uppercase tracking-wide">
                        Criado em {new Date(servico.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={`tel:${servico.prestadores?.whatsapp}`}
                      className="w-14 h-14 rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-green-600 hover:border-green-100 hover:bg-green-50 transition-all"
                    >
                      <Phone size={20} />
                    </a>
                    <button
                      onClick={() => handleAceiteTecnico(servico)}
                      className="flex-1 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                      Autorizar Serviço <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 backdrop-blur-sm">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-lg font-black italic uppercase leading-none tracking-tight">Protocolo Seguro</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1 leading-relaxed max-w-[200px]">
                Ao autorizar, você gera um token único de acompanhamento criptografado.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
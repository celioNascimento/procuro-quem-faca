'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Clock, CheckCircle2, ChevronRight, User, Smartphone,
  LayoutGrid, ShieldCheck, Search, Phone, LogIn, ExternalLink, X, ZoomIn
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PainelDoCliente() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [zoomImage, setZoomImage] = useState(null) // Estado para o modal de zoom

  const loginComGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/meus-servicos` }
    })
  }

  const handleAceiteTecnico = async (servico) => {
    try {
      const { error } = await supabase
        .from('portfolio_projetos')
        .update({ 
          status: 'em_execucao',
          aceito_at: new Date().toISOString() 
        })
        .eq('id', servico.id)

      if (error) {
        console.error('Erro ao atualizar status:', error)
        return
      }

      router.push(`/avaliar/${servico.id}?token=${servico.avaliacao_token}`)
    } catch (err) {
      console.error('Falha na comunicação:', err)
    }
  }

  const buscarDados = async (user) => {
    setLoading(true)
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(prof)
    const whatsapp = prof?.whatsapp || localStorage.getItem('cliente_whatsapp')
    
    if (whatsapp) {
      const { data: projs } = await supabase
        .from('portfolio_projetos')
        .select(`
          *,
          prestadores (nome, foto_perfil, whatsapp, categoria:categorias(nome)),
          portfolio_fotos (*)
        `)
        .eq('cliente_whatsapp', whatsapp.replace(/\D/g, ''))
        .eq('status', 'pendente') 
        .order('created_at', { ascending: false })

      if (projs && projs.length > 0) {
        setServicos(projs)
      } else {
        router.push('/painel/perfil')
      }
    } else {
        router.push('/painel/perfil')
    }
    setLoading(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) buscarDados(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) buscarDados(session.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-10 h-10 border-[4px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Sincronizando Arquivos</p>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-10 md:mb-14 flex justify-center w-full">
        <div className="block w-full max-w-[280px] md:max-w-[420px] transition-transform duration-300">
          <img 
            src="/logo.png" 
            alt="Procuro Quem Faça" 
            className="w-full h-auto object-contain drop-shadow-sm" 
          />
        </div>
      </div>

      <div className="max-w-sm w-full bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-slate-100 text-center space-y-8">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner">
          <ShieldCheck size={28} className="md:w-8 md:h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">Acesse seus<br/>Contratos</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Identidade Digital Necessária</p>
        </div>
        <button 
          onClick={loginComGoogle}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100 touch-manipulation"
        >
          <LogIn size={18} /> Entrar com Google
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-24 font-sans antialiased">
      
      {/* MODAL DE ZOOM (Adicionado para avaliação do cliente) */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setZoomImage(null)}
        >
          <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
          <img 
            src={zoomImage} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            alt="Zoom do Registro"
          />
          <p className="absolute bottom-10 text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">Toque fora para fechar</p>
        </div>
      )}

      <div className="max-w-xl mx-auto px-5 pt-8 md:pt-12 space-y-8">

        <div className="flex justify-between items-center bg-white p-4 md:p-5 rounded-[2rem] md:rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <img 
              src={profile?.avatar_url || session.user.user_metadata.avatar_url} 
              className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover border-2 border-blue-100 shadow-md shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-xs md:text-sm font-black italic uppercase text-slate-800 leading-none truncate">
                {profile?.full_name || session.user.user_metadata.full_name}
              </h2>
              <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">
                {profile?.whatsapp || 'Sem WhatsApp'}
              </p>
            </div>
          </div>
          <div className="bg-blue-50 p-2.5 md:p-3 rounded-xl md:rounded-2xl text-blue-600 shrink-0">
            <User size={18} className="md:w-5 md:h-5" />
          </div>
        </div>

        <div className="space-y-1 px-1">
          <h1 className="text-3xl md:text-4xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">
            Projetos<br />Em Aberto
          </h1>
          <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] italic">Aguardando seu aceite técnico</p>
        </div>

        <div className="space-y-6">
          {servicos.map((servico) => {
            const fotoInicio = servico.portfolio_fotos?.find(f => f.ordem === 1)
            
            return (
              <div key={servico.id} className="bg-white rounded-[2.5rem] md:rounded-[3rem] border-2 border-slate-50 shadow-xl overflow-hidden group transition-all">
                <div className="p-5 md:p-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={servico.prestadores.foto_perfil} className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Prestador</p>
                      <h3 className="text-[11px] font-black uppercase italic text-slate-800">{servico.prestadores.nome}</h3>
                    </div>
                  </div>
                  <a 
                    href={`tel:${servico.prestadores.whatsapp}`} 
                    className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 active:bg-green-600 active:text-white transition-all shadow-sm touch-manipulation"
                  >
                    <Phone size={18} />
                  </a>
                </div>

                <div className="p-5 md:p-6 space-y-4">
                  <div className="flex justify-between items-end gap-2">
                    <div className="space-y-1 min-w-0">
                      <span className="text-[7px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md tracking-tighter">
                        {servico.prestadores.categoria?.nome}
                      </span>
                      <h4 className="text-lg md:text-xl font-black uppercase italic leading-none tracking-tight text-slate-800 truncate">
                        {servico.titulo}
                      </h4>
                    </div>
                    <div className="text-right shrink-0">
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Iniciado</p>
                       <p className="text-[9px] font-bold text-slate-500 italic">{new Date(servico.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Container de Imagem com Acionador de Zoom */}
                  <div 
                    onClick={() => fotoInicio && setZoomImage(fotoInicio.url_foto)}
                    className="relative aspect-video rounded-[1.8rem] md:rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner group/img cursor-zoom-in active:scale-[0.99] transition-transform"
                  >
                    {fotoInicio ? (
                      <>
                        <img src={fotoInicio.url_foto} className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" alt="Início" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white border border-white/30">
                            <ZoomIn size={20} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 italic text-[9px] uppercase font-black text-center px-4">
                        Aguardando Foto de Início
                      </div>
                    )}
                    <div className="absolute top-3 left-3 md:top-4 md:left-4 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[7px] font-black uppercase tracking-widest border border-white/10">
                      Registro de Entrada
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAceiteTecnico(servico)}
                    className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-blue-100 touch-manipulation"
                  >
                    Aceitar Início <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-blue-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-100">
          <div className="absolute -top-4 -right-4 opacity-10 rotate-12">
            <ShieldCheck size={100} strokeWidth={3} />
          </div>
          <div className="relative z-10 space-y-3 text-center">
            <p className="text-xl md:text-2xl font-black italic uppercase leading-none tracking-tighter">Protocolo de Confiança</p>
            <p className="text-[8px] md:text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] leading-relaxed max-w-[220px] mx-auto">Sua aprovação é essencial para a segurança do serviço.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
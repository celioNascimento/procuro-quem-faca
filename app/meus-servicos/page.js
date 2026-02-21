'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Clock, CheckCircle2, ChevronRight, User, Smartphone,
  LayoutGrid, ShieldCheck, Search, Phone, LogIn, ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PainelDoCliente() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)

  const loginComGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/meus-servicos` }
    })
  }

  // PRECISÃO TÉCNICA: Ajuste para garantir a persistência antes do redirecionamento
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

      // Redireciona apenas após a confirmação do banco
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
      // VERIFICAÇÃO CIRÚRGICA: Filtramos apenas por 'pendente' para o aceite inicial
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-[4px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Sincronizando Arquivos</p>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 text-center space-y-8">
        <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner">
          <ShieldCheck size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">Acesse seus<br/>Contratos</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identidade Digital Necessária</p>
        </div>
        <button 
          onClick={loginComGoogle}
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100"
        >
          <LogIn size={18} /> Entrar com Google
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 pb-20 font-sans antialiased">
      <div className="max-w-xl mx-auto px-6 pt-12 space-y-8">

        <div className="flex justify-between items-center bg-white p-5 rounded-[2.5rem] border-2 border-slate-50 shadow-sm">
          <div className="flex items-center gap-4">
            <img 
              src={profile?.avatar_url || session.user.user_metadata.avatar_url} 
              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-100 shadow-md"
            />
            <div>
              <h2 className="text-sm font-black italic uppercase text-slate-800 leading-none">
                {profile?.full_name || session.user.user_metadata.full_name}
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {profile?.whatsapp || 'WhatsApp não vinculado'}
              </p>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <User size={20} />
          </div>
        </div>

        <div className="space-y-1 px-2">
          <h1 className="text-4xl font-black italic uppercase text-slate-800 leading-none tracking-tighter">
            Projetos<br />Em Aberto
          </h1>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] italic">Aguardando seu aceite técnico</p>
        </div>

        <div className="space-y-6">
          {servicos.map((servico) => {
            const fotoInicio = servico.portfolio_fotos?.find(f => f.ordem === 1)
            
            return (
              <div key={servico.id} className="bg-white rounded-[3rem] border-2 border-slate-50 shadow-xl overflow-hidden group transition-all hover:border-blue-100">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={servico.prestadores.foto_perfil} className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Prestador</p>
                      <h3 className="text-xs font-black uppercase italic text-slate-800">{servico.prestadores.nome}</h3>
                    </div>
                  </div>
                  <a 
                    href={`tel:${servico.prestadores.whatsapp}`} 
                    className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                  >
                    <Phone size={18} />
                  </a>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md tracking-tighter">
                        {servico.prestadores.categoria?.nome}
                      </span>
                      <h4 className="text-xl font-black uppercase italic leading-none tracking-tight text-slate-800">
                        {servico.titulo}
                      </h4>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Iniciado em</p>
                       <p className="text-[10px] font-bold text-slate-500 italic">{new Date(servico.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner group-hover:scale-[1.01] transition-transform">
                    {fotoInicio ? (
                      <img src={fotoInicio.url_foto} className="w-full h-full object-cover" alt="Início do serviço" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 italic text-[10px] uppercase font-black">
                        Aguardando Foto de Início
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[8px] font-black uppercase tracking-widest border border-white/10">
                      Registro de Entrada
                    </div>
                  </div>

                  <button 
                    onClick={() => handleAceiteTecnico(servico)}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                  >
                    Aceitar Início <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-100">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <ShieldCheck size={120} strokeWidth={3} />
          </div>
          <div className="relative z-10 space-y-4 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-black italic uppercase leading-none tracking-tighter">Protocolo de Confiança</p>
              <p className="text-[9px] font-black text-blue-100 uppercase tracking-[0.2em]">Sua aprovação é essencial para a segurança do serviço.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
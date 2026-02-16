'use client'
import { useEffect, useState, use, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Star, Clock, X, ShieldCheck, ChevronRight, User, MessageSquare, Send, Loader2, Phone, Briefcase } from 'lucide-react'
import HeaderCliente from '@/components/HeaderCliente'

export default function PaginaAvaliacaoCliente({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [projeto, setProjeto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [fotoSelecionada, setFotoSelecionada] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [historicoEtapa, setHistoricoEtapa] = useState([])
  const [notificacoesEtapas, setNotificacoesEtapas] = useState({}) 

  const [nota, setNota] = useState(0)
  const [hoverNota, setHoverNota] = useState(0)
  const [comentarioGeral, setComentarioGeral] = useState('')
  const [novoComentarioEtapa, setNovoComentarioEtapa] = useState('')
  
  const scrollRef = useRef(null)

  useEffect(() => { setMounted(true) }, []);

  const formatarTelefone = (val) => {
    if (!val) return ''
    const v = val.replace(/\D/g, '')
    if (v.length > 10) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
    return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`
  }

  const tocarSom = (tipo = 'sucesso') => {
    const url = tipo === 'sucesso' 
      ? 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' 
      : 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'
    new Audio(url).play().catch(() => {})
  }

  // --- LÓGICA DE PERSISTÊNCIA LOCAL (Resolve o F5) ---
  const getLidosLocal = (projId) => {
    if (typeof window === 'undefined') return {}
    const salvo = localStorage.getItem(`msgs_lidas_${projId}`)
    return salvo ? JSON.parse(salvo) : {}
  }

  const salvarLeituraLocal = (projId, fotoId, msgId) => {
    const atuais = getLidosLocal(projId)
    atuais[fotoId] = msgId
    localStorage.setItem(`msgs_lidas_${projId}`, JSON.stringify(atuais))
  }
  // ----------------------------------------------------

  // Carregamento Inicial
  useEffect(() => {
    async function carregar() {
      if (!token || !mounted) return
      
      const { data } = await supabase
        .from('portfolio_projetos')
        .select(`*, portfolio_fotos(*), prestadores(nome, foto_perfil, whatsapp, categoria:categorias(nome))`)
        .eq('id', params.id).eq('avaliacao_token', token).single()

      if (data) {
        setProjeto(data)
        
        // 1. Busca mensagens
        const { data: todasMsgs } = await supabase.from('portfolio_comentarios')
          .select('id, foto_id, autor_tipo, criado_at')
          .eq('projeto_id', data.id)
          .order('criado_at', { ascending: false }) // Mais recentes primeiro

        // 2. Recupera o que já foi lido neste navegador
        const lidos = getLidosLocal(data.id)
        const nMap = {}
        const fotosProcessadas = new Set()
        
        todasMsgs?.forEach(m => {
          if (!fotosProcessadas.has(m.foto_id)) {
            // Esta é a última mensagem desta foto
            const jaLeuEstaMsg = lidos[m.foto_id] === m.id

            // Notifica SE: (É do prestador) E (Ainda não foi lida/salva localmente)
            if (m.autor_tipo === 'prestador' && !jaLeuEstaMsg) {
              nMap[m.foto_id] = true
            }
            fotosProcessadas.add(m.foto_id)
          }
        })
        setNotificacoesEtapas(nMap)
      }
      setLoading(false)
    }
    carregar()
  }, [params.id, token, mounted])

  // Realtime
  useEffect(() => {
    if (!projeto?.id) return
    const channel = supabase
      .channel('cliente_chat_' + projeto.id)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'portfolio_comentarios',
        filter: `projeto_id=eq.${projeto.id}`
      }, (payload) => {
        // Se mensagem do PRESTADOR
        if (payload.new.autor_tipo === 'prestador') {
          if (fotoSelecionada && payload.new.foto_id === fotoSelecionada.id) {
            // Chat aberto: atualiza lista e já marca como lido no storage
            setHistoricoChat(prev => [...prev, payload.new])
            salvarLeituraLocal(projeto.id, payload.new.foto_id, payload.new.id)
            tocarSom('alerta')
          } else {
            // Chat fechado: marca notificação visual
            setNotificacoesEtapas(prev => ({ ...prev, [payload.new.foto_id]: true }))
            tocarSom('alerta')
          }
        } 
        // Se mensagem do CLIENTE (outra aba)
        else if (payload.new.autor_tipo === 'cliente') {
           if (fotoSelecionada && payload.new.foto_id === fotoSelecionada.id) {
             setHistoricoChat(prev => {
               if (prev.some(m => m.id === payload.new.id)) return prev;
               const novoArr = [...prev, payload.new]
               // Cliente respondeu, então a última msg agora é dele (automaticamente lido)
               salvarLeituraLocal(projeto.id, payload.new.foto_id, payload.new.id)
               return novoArr
             })
           }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projeto?.id, fotoSelecionada])

  // Scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [historicoEtapa])

  const buscarComentariosEtapa = async (fotoId) => {
    const { data } = await supabase
      .from('portfolio_comentarios')
      .select('*')
      .eq('foto_id', fotoId)
      .order('criado_at', { ascending: true })
    
    if (data) {
      setHistoricoEtapa(data)
      
      // Remove notificação visual
      setNotificacoesEtapas(prev => ({ ...prev, [fotoId]: false }))
      
      // SALVA NO LOCALSTORAGE QUE A ÚLTIMA MENSAGEM FOI LIDA
      if (data.length > 0) {
        const ultimaMsg = data[data.length - 1]
        salvarLeituraLocal(projeto.id, fotoId, ultimaMsg.id)
      }
    }
  }

  useEffect(() => {
    if (fotoSelecionada) buscarComentariosEtapa(fotoSelecionada.id)
  }, [fotoSelecionada])

  const enviarComentarioEtapa = async () => {
    if (!novoComentarioEtapa.trim() || savingComment || !fotoSelecionada) return
    setSavingComment(true)
    try {
      const { data, error } = await supabase.from('portfolio_comentarios').insert({
        foto_id: fotoSelecionada.id,
        projeto_id: projeto.id,
        autor_tipo: 'cliente',
        texto: novoComentarioEtapa.trim()
      }).select().single()

      if (error) throw error
      
      tocarSom('sucesso')
      setNovoComentarioEtapa('')
      
      setHistoricoEtapa(prev => [...prev, data])
      setNotificacoesEtapas(prev => ({ ...prev, [fotoSelecionada.id]: false }))
      // Salva que a última msg (a minha própria) é a atual, garantindo estado limpo
      salvarLeituraLocal(projeto.id, fotoSelecionada.id, data.id)

    } catch (err) { alert("Erro ao enviar ideia.") } finally { setSavingComment(false) }
  }

  if (!mounted || loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-[4px] border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Carregando</p>
    </div>
  )

  if (!projeto) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
      <div className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-slate-100 max-w-sm">
        <span className="text-4xl mb-6 block">🚫</span>
        <h1 className="font-black italic text-2xl text-slate-800 mb-2 leading-none">Link Expirado</h1>
        <p className="text-[10px] text-slate-400 font-black uppercase">Este acesso não é mais válido.</p>
      </div>
    </div>
  )

  const temConclusao = projeto.portfolio_fotos?.some(f => f.ordem === 3)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome?.split(' ')[0]} />

      <div className="max-w-xl mx-auto px-6 pt-8 space-y-8 animate-in fade-in duration-700">
        
        {/* CARD DO PRESTADOR */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative shrink-0">
              <img src={projeto.prestadores?.foto_perfil} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" alt="Profissional" />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1 rounded-lg border-2 border-white shadow-md">
                <ShieldCheck size={12} strokeWidth={3} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                {projeto.prestadores?.categoria?.nome || 'Profissional'}
              </p>
              <h2 className="text-lg font-black text-slate-800 leading-none truncate mb-2">
                {projeto.prestadores?.nome}
              </h2>
              
              <div className="flex items-center gap-3">
                 <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg truncate">
                    {formatarTelefone(projeto.prestadores?.whatsapp)}
                 </span>
                 {projeto.prestadores?.whatsapp && (
                  <a 
                    href={`tel:${projeto.prestadores.whatsapp.replace(/\D/g, '')}`} 
                    className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full shadow-lg shadow-green-200 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Phone size={14} fill="currentColor" />
                  </a>
                 )}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-slate-50 flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 leading-none mb-1">Projeto Atual</p>
              <h1 className="text-sm font-black italic text-slate-900 leading-none">{projeto.titulo}</h1>
            </div>
          </div>
          
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60 z-0 pointer-events-none" />
        </div>

        {/* GRADE DE ETAPAS */}
        <div className="space-y-5">
          <div className="flex items-center gap-4 px-2">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Acompanhamento</p>
            <div className="h-[1px] flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {projeto.portfolio_fotos?.sort((a, b) => a.ordem - b.ordem).map((foto) => (
              <button
                key={foto.id}
                onClick={() => setFotoSelecionada(foto)}
                className="group relative aspect-square rounded-[2rem] overflow-hidden bg-white border-2 border-slate-100 shadow-sm active:scale-95 transition-all"
              >
                <img src={foto.url_foto} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={foto.legenda} />
                
                {notificacoesEtapas[foto.id] && (
                  <div className="absolute top-2 right-2 z-20 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <MessageSquare size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pt-6">
                  <span className="w-full block text-[8px] font-black uppercase text-white text-center truncate shadow-sm">
                    {foto.legenda}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AVALIAÇÃO FINAL */}
        <div className="pb-10">
          {temConclusao ? (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter">Avaliação</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua opinião é importante</p>
              </div>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onMouseEnter={() => setHoverNota(star)} onMouseLeave={() => setHoverNota(0)} onClick={() => setNota(star)} className="transition-all active:scale-90 p-1 hover:-translate-y-1">
                    <Star size={34} fill={(hoverNota || nota) >= star ? "#2563eb" : "transparent"} color={(hoverNota || nota) >= star ? "#2563eb" : "#CBD5E1"} strokeWidth={2.5} />
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <textarea className="w-full p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 focus:border-blue-200 outline-none text-xs font-bold text-slate-700 transition-all min-h-[100px] placeholder:text-slate-400 resize-none" placeholder="Escreva seu depoimento..." value={comentarioGeral} onChange={e => setComentarioGeral(e.target.value)} />
                <button disabled={nota === 0 || submitting} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3" onClick={async () => {
                  setSubmitting(true);
                  try {
                    const { error } = await supabase.from('avaliacoes').insert({ projeto_id: projeto.id, prestador_id: projeto.prestador_id, nota, comentario: comentarioGeral, cliente_whatsapp: projeto.cliente_whatsapp });
                    if (error) throw error;
                    router.push('/sucesso');
                  } catch (err) { alert("Erro ao enviar"); } finally { setSubmitting(false); }
                }}>
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Enviar Avaliação'}
                  {!submitting && <ChevronRight size={14} strokeWidth={3} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-3 opacity-60">
              <Clock className="text-slate-300" size={28} />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Aguardando conclusão</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHAT CLIENTE */}
      {fotoSelecionada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg flex flex-col h-[85vh] shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
            
            {/* HEADER FOTO + FECHAR */}
            <div className="relative shrink-0 h-48">
              <img src={fotoSelecionada.url_foto} className="w-full h-full object-cover" alt="Zoom" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button onClick={() => setFotoSelecionada(null)} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 active:scale-90 transition-transform"><X size={20} /></button>
              <div className="absolute bottom-4 left-6">
                 <p className="text-[10px] font-black uppercase text-white/80 tracking-widest mb-1">Chat da Etapa</p>
                 <h2 className="text-xl font-black text-white italic">{fotoSelecionada.legenda}</h2>
              </div>
            </div>
            
            {/* ÁREA DE MENSAGENS */}
            <div className="flex-1 bg-slate-50 flex flex-col min-h-0 relative">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                {historicoEtapa.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-10 opacity-40 space-y-3">
                    <MessageSquare size={32} className="text-slate-300" />
                    <p className="text-[10px] font-black uppercase text-slate-400 leading-relaxed">Envie sua dúvida ou sugestão para o profissional sobre esta etapa.</p>
                  </div>
                ) : (
                  historicoEtapa.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.autor_tipo === 'cliente' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white shadow-sm mt-auto bg-white flex items-center justify-center">
                        {msg.autor_tipo === 'prestador' ? <img src={projeto.prestadores?.foto_perfil} className="w-full h-full object-cover"/> : <User size={14} className="text-slate-300"/>}
                      </div>
                      <div className={`flex flex-col max-w-[80%] ${msg.autor_tipo === 'cliente' ? 'items-end' : 'items-start'}`}>
                        <span className={`text-[8px] font-black uppercase mb-1 px-2 ${msg.autor_tipo === 'cliente' ? 'text-blue-600' : 'text-slate-400'}`}>
                          {msg.autor_tipo === 'cliente' ? 'Você' : projeto.prestadores?.nome?.split(' ')[0]}
                        </span>
                        <div className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-sm leading-relaxed ${msg.autor_tipo === 'cliente' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-700 rounded-tl-sm border border-slate-100'}`}>
                          {msg.texto}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* INPUT AREA */}
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2 shrink-0 pb-6">
                <input 
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-[1.2rem] px-5 py-4 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 transition-all placeholder:text-slate-400"
                  placeholder="Escreva sua mensagem..."
                  value={novoComentarioEtapa}
                  onChange={e => setNovoComentarioEtapa(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') enviarComentarioEtapa(); }}
                />
                <button 
                  onClick={enviarComentarioEtapa}
                  disabled={savingComment || !novoComentarioEtapa.trim()}
                  className="p-4 bg-blue-600 text-white rounded-[1.2rem] active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
                >
                  {savingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
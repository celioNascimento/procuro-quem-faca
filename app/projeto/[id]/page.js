'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { Send, Camera, History, Check, Loader2, ChevronLeft, User } from 'lucide-react'

export default function ProjetoTimeline({ projetoId, userTipo = 'cliente' }) {
  const params = useParams()
  const router = useRouter()
  // Garante que o ID venha da prop ou da URL
  const idDoProjeto = projetoId || params?.id

  const [projeto, setProjeto] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [novaMsg, setNovaMsg] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const scrollRef = useRef(null)

  const formatarData = (dataStr) => {
    try {
      const data = new Date(dataStr)
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data)
    } catch (e) { return '--:--' }
  }

  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior }), 100)
  }

  useEffect(() => {
    if (!idDoProjeto) {
      setCarregando(false)
      return
    }

    async function carregarDados() {
      try {
        // 1. Busca dados do Projeto (Título, Status) e do Prestador (Nome, Foto)
        const { data: projetoData, error: projetoError } = await supabase
          .from('portfolio_projetos')
          .select(`
            titulo, 
            status, 
            prestadores ( nome, foto_perfil )
          `)
          .eq('id', idDoProjeto)
          .single()

        if (projetoError) throw projetoError
        setProjeto(projetoData)

        // 2. Busca as mensagens
        const { data: msgsData, error: msgsError } = await supabase
          .from('projeto_mensagens')
          .select('*')
          .eq('projeto_id', idDoProjeto)
          .order('created_at', { ascending: true })
        
        if (msgsError) throw msgsError
        if (msgsData) setMensagens(msgsData)

      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setCarregando(false)
        scrollToBottom('auto')
      }
    }

    carregarDados()

    // Realtime
    const channel = supabase.channel(`room_${idDoProjeto}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'projeto_mensagens', 
        filter: `projeto_id=eq.${idDoProjeto}` 
      }, (payload) => {
        setMensagens(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
        scrollToBottom()
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [idDoProjeto])

  const enviarMensagem = async (e) => {
    e.preventDefault()
    if (!novaMsg.trim() || enviando || !idDoProjeto) return

    setEnviando(true)
    const textoOriginal = novaMsg
    setNovaMsg('')

    // UI Otimista (aparece na hora)
    const msgTemporaria = {
      id: `temp-${Date.now()}`,
      projeto_id: idDoProjeto,
      conteudo: textoOriginal,
      remetente_tipo: userTipo,
      tipo_evento: 'chat',
      created_at: new Date().toISOString(),
      temp: true
    }

    setMensagens(prev => [...prev, msgTemporaria])
    scrollToBottom()

    try {
      const { data, error } = await supabase.from('projeto_mensagens').insert({
        projeto_id: idDoProjeto,
        conteudo: textoOriginal, 
        remetente_tipo: userTipo,
        tipo_evento: 'chat'
      }).select().single()

      if (error) throw error
      // Substitui temporária pela real
      setMensagens(prev => prev.map(m => m.id === msgTemporaria.id ? data : m))
      
    } catch (error) {
      console.error('Erro ao enviar:', error)
      setNovaMsg(textoOriginal)
      setMensagens(prev => prev.filter(m => m.id !== msgTemporaria.id))
      alert('Erro ao enviar mensagem.')
    } finally {
      setEnviando(false)
      scrollToBottom()
    }
  }

  // Lógica de cores do status (Sincronizada com PerfilDoCliente)
  const isFinalizado = projeto?.status === 'finalizado'
  const statusCor = isFinalizado ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
  const statusTexto = isFinalizado ? 'Concluído' : 'Em Execução'

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Carregando...</p>
      </div>
    )
  }

  if (!idDoProjeto) return <div className="p-10 text-center text-slate-400">Projeto não encontrado</div>

  return (
    // LAYOUT PRINCIPAL: h-[100dvh] e Flexbox garantem que o input não sobreponha
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 antialiased overflow-hidden">
      
      {/* CABEÇALHO */}
      <header className="bg-white px-4 py-4 border-b border-slate-100 flex items-center gap-4 shadow-sm shrink-0 z-20">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        
        {projeto && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Avatar do Prestador no Header */}
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-100 shrink-0">
               {projeto.prestadores?.foto_perfil ? (
                 <img src={projeto.prestadores.foto_perfil} className="w-full h-full object-cover" />
               ) : (
                 <User className="w-full h-full p-2 text-slate-400" />
               )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-slate-800 truncate leading-tight">{projeto.titulo}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{projeto.prestadores?.nome || 'Profissional'}</span>
                 <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${statusCor}`}>
                    {statusTexto}
                 </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* LISTA DE MENSAGENS */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide bg-slate-50">
        {mensagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40">
            <History size={24} className="text-slate-400 mb-3"/>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inicie a conversa</p>
          </div>
        ) : (
          mensagens.map((msg, index) => {
            const isSistema = msg.tipo_evento !== 'chat'
            const isMe = msg.remetente_tipo === userTipo
            const msgAnterior = mensagens[index - 1]
            const mesmoRemetente = msgAnterior && msgAnterior.remetente_tipo === msg.remetente_tipo

            if (isSistema) {
              return (
                <div key={msg.id || index} className="flex justify-center py-2">
                  <div className="bg-slate-200/50 px-4 py-1.5 rounded-full flex items-center gap-2">
                    <Camera size={10} className="text-slate-500" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{msg.conteudo}</span>
                  </div>
                </div>
              )
            }

            return (
              <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`flex max-w-[85%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* AVATAR AO LADO DA MENSAGEM */}
                  {!mesmoRemetente ? (
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-100 overflow-hidden shrink-0 shadow-sm mt-auto">
                      {isMe ? (
                         <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500">
                           <User size={14} strokeWidth={3} />
                         </div>
                      ) : (
                         projeto?.prestadores?.foto_perfil ? (
                           <img src={projeto.prestadores.foto_perfil} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                             <User size={14} />
                           </div>
                         )
                      )}
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  {/* BALÃO DA MENSAGEM */}
                  <div className={`px-5 py-3 rounded-[1.25rem] shadow-sm border text-[13px] leading-relaxed whitespace-pre-wrap ${
                    isMe 
                    ? 'bg-blue-600 text-white border-blue-600 rounded-tr-sm' 
                    : 'bg-white text-slate-800 border-slate-200 rounded-tl-sm font-medium'
                  } ${msg.temp ? 'opacity-70' : ''}`}>
                    
                    {msg.conteudo}
                    
                    <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-200' : 'text-slate-300'}`}>
                      <span className="text-[8px] font-black uppercase tracking-tighter">
                        {msg.temp ? '...' : formatarData(msg.created_at)}
                      </span>
                      {isMe && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={scrollRef} className="h-2" />
      </div>

      {/* ÁREA DE INPUT (Flex Item, não Fixed) */}
      <div className="bg-white border-t border-slate-100 p-3 pb-safe shrink-0 z-20">
        <form onSubmit={enviarMensagem} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={novaMsg}
            onChange={(e) => setNovaMsg(e.target.value)}
            disabled={enviando}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-[1.25rem] px-5 py-3.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={enviando || !novaMsg.trim()} 
            className="bg-blue-600 text-white w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-slate-200 active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            {enviando ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} strokeWidth={2.5} />}
          </button>
        </form>
      </div>
    </div>
  )
}
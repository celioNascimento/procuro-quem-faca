'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, Camera, History, Check, CheckCheck, User } from 'lucide-react'

export default function ProjetoTimeline({ projetoId, userTipo = 'cliente' }) {
  // 1. NORMALIZAÇÃO DE IDENTIDADE
  const souPrestador = userTipo?.toLowerCase() === 'prestador';
  const meuTipoNoBanco = souPrestador ? 'prestador' : 'visitante';

  const [mensagens, setMensagens] = useState([])
  const [novaMsg, setNovaMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [dadosProjeto, setDadosProjeto] = useState(null)
  const scrollRef = useRef(null)

  const formatarData = (dataStr) => {
    try {
      if (!dataStr) return '';
      const data = new Date(dataStr)
      return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data)
    } catch (e) { return '' }
  }

  const identificarRemetente = (tipoNoBanco) => {
    if (!tipoNoBanco) return 'visitante';
    return tipoNoBanco.toLowerCase() === 'prestador' ? 'prestador' : 'visitante';
  }

  const scrollToBottom = (behavior = 'smooth') => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior }), 100)
  }

  useEffect(() => {
    async function carregarDados() {
      const { data: proj } = await supabase
        .from('portfolio_projetos')
        .select(`id, cliente_nome, prestadores (nome, foto_perfil)`)
        .eq('id', projetoId)
        .single()
      
      if (proj) setDadosProjeto(proj)

      const { data: msgs } = await supabase
        .from('projeto_mensagens')
        .select('*')
        .eq('projeto_id', projetoId)
        .order('created_at', { ascending: true })

      if (msgs) setMensagens(msgs || [])
      setLoading(false)
      scrollToBottom('auto')
      marcarComoLidas();
    }

    carregarDados()

    // CANAL ÚNICO: Garante que ambos os lados ouçam a mesma sala
    const channel = supabase
      .channel(`projeto_${projetoId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'projeto_mensagens', 
        filter: `projeto_id=eq.${projetoId}` 
      }, (payload) => {
        setMensagens(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        })
        
        if (identificarRemetente(payload.new.remetente_tipo) !== meuTipoNoBanco) {
          marcarComoLidas();
        }
        scrollToBottom()
      })
      .on('postgres_changes', {
        event: 'UPDATE', 
        schema: 'public', 
        table: 'projeto_mensagens', 
        filter: `projeto_id=eq.${projetoId}`
      }, (payload) => {
        setMensagens(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projetoId, meuTipoNoBanco])

  const marcarComoLidas = async () => {
    await supabase
      .from('projeto_mensagens')
      .update({ lido: true })
      .eq('projeto_id', projetoId)
      .neq('remetente_tipo', meuTipoNoBanco)
      .eq('lido', false)
  }

  const enviarMensagem = async (e) => {
    e.preventDefault()
    if (!novaMsg.trim()) return

    const texto = novaMsg
    setNovaMsg('')

    // OPTIMISTIC UI: Insere e já atualiza a tela local
    const { data, error } = await supabase.from('projeto_mensagens').insert({
      projeto_id: projetoId,
      conteudo: texto,
      remetente_tipo: meuTipoNoBanco,
      tipo_evento: 'chat',
      lido: false
    }).select().single()

    if (data) {
      setMensagens(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      })
      scrollToBottom()
    } else if (error) {
      setNovaMsg(texto)
      console.error("Erro ao enviar:", error)
    }
  }

  if (loading) return <div className="h-full flex items-center justify-center text-[10px] font-black uppercase text-slate-300 animate-pulse">Sincronizando...</div>

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto space-y-4 px-3 scrollbar-hide pt-4 pb-4">
        {mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <History size={32} className="mb-2" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Início do Diário</p>
          </div>
        )}

        {mensagens.map((msg, index) => {
          const isSistema = msg.tipo_evento !== 'chat'
          const quemMandou = identificarRemetente(msg.remetente_tipo);
          const isMe = quemMandou === meuTipoNoBanco;
          const msgAnterior = mensagens[index - 1]
          const mesmoRemetente = msgAnterior && identificarRemetente(msgAnterior.remetente_tipo) === quemMandou

          if (isSistema) {
            return (
              <div key={msg.id} className="flex justify-center py-2">
                <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-2">
                  <Camera size={10} className="text-blue-500" />
                  <span className="text-[8px] font-black text-slate-400 uppercase italic">{msg.conteudo}</span>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1 animate-in fade-in duration-300`}>
              {!mesmoRemetente && !isMe && (
                <span className="text-[8px] font-black uppercase text-slate-400 mb-1 ml-9 tracking-widest">
                  {quemMandou === 'prestador' ? dadosProjeto?.prestadores?.nome : (dadosProjeto?.cliente_nome || 'Cliente')}
                </span>
              )}

              <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center ${mesmoRemetente ? 'invisible' : 'visible'}`}>
                   {quemMandou === 'prestador' && dadosProjeto?.prestadores?.foto_perfil ? (
                     <img src={dadosProjeto.prestadores.foto_perfil} className="w-full h-full object-cover" />
                   ) : (
                     <User size={14} className="text-slate-300" />
                   )}
                </div>

                <div className={`px-4 py-2.5 rounded-2xl shadow-sm border relative ${
                  isMe ? 'bg-blue-600 text-white border-blue-600 rounded-tr-none' : 'bg-white text-slate-700 border-slate-200 rounded-tl-none font-medium'
                }`}>
                  <p className="text-[13px] leading-snug">{msg.conteudo}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-100' : 'text-slate-300'}`}>
                    <span className="text-[9px] font-bold">{formatarData(msg.created_at)}</span>
                    {isMe && (
                      msg.lido ? <CheckCheck size={13} strokeWidth={3} className="text-white" /> : <Check size={13} strokeWidth={3} className="opacity-70" /> 
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} className="h-2" />
      </div>

      <form onSubmit={enviarMensagem} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          value={novaMsg}
          onChange={(e) => setNovaMsg(e.target.value)}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
        />
        <button type="submit" className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100">
          <Send size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  )
}

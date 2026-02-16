'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Smartphone, Briefcase, Camera, Send, Check, X, Maximize2, MessageSquare, Loader2, User, CheckCircle2, Phone } from 'lucide-react'

export default function UploadWizard({ prestadorId, projetoExistente = null, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [projetoId, setProjetoId] = useState(projetoExistente?.id || null)
  const [titulo, setTitulo] = useState(projetoExistente?.titulo || '')
  
  // Inicializa já formatado se existir
  const [clienteWhatsapp, setClienteWhatsapp] = useState(projetoExistente?.cliente_whatsapp || '')
  const [clienteNome, setClienteNome] = useState(projetoExistente?.cliente_nome || '') 
  const [clienteFoto, setClienteFoto] = useState(null) 
  
  const [fotosUrls, setFotosUrls] = useState({ 1: null, 2: null, 3: null })
  const [fotosData, setFotosData] = useState({ 1: null, 2: null, 3: null }) 
  const [fotosComentarios, setFotosComentarios] = useState({}) 
  const [zoomFoto, setZoomFoto] = useState(null)

  const [chatAberto, setChatAberto] = useState(null) 
  const [historicoChat, setHistoricoChat] = useState([])
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  const whatsappValido = clienteWhatsapp.replace(/\D/g, '').length >= 11
  const tituloValido = titulo.trim().length > 3

  // FUNÇÃO DE MÁSCARA DE TELEFONE
  const formatarTelefone = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, '')
    if (apenasNumeros.length <= 2) return apenasNumeros
    if (apenasNumeros.length <= 7) return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`
  }

  const handlePhoneChange = (e) => {
    const valorFormatado = formatarTelefone(e.target.value)
    setClienteWhatsapp(valorFormatado)
  }

  const getEtapaLabel = (n) => {
    if (n === 1) return "Início"; if (n === 2) return "Execução"; return "Conclusão";
  }

  const buscarDadosCliente = useCallback(async (whatsapp) => {
    const numLimpo = whatsapp.replace(/\D/g, '')
    if (numLimpo.length < 11) return
    try {
      const { data } = await supabase.from('profiles').select('avatar_url, full_name').eq('whatsapp', numLimpo).maybeSingle()
      if (data) {
        setClienteFoto(data.avatar_url)
        if (data.full_name) setClienteNome(data.full_name)
      }
    } catch (e) { console.error(e) }
  }, [])

  const carregarProgresso = useCallback(async (projId) => {
    const { data: fotos } = await supabase.from('portfolio_fotos').select('*').eq('projeto_id', projId)
    if (fotos) {
      const fMap = { 1: null, 2: null, 3: null }; const dMap = { 1: null, 2: null, 3: null }
      fotos.forEach(f => { fMap[f.ordem] = f.url_foto; dMap[f.ordem] = f })
      setFotosUrls(fMap); setFotosData(dMap)

      const { data: todasMsgs } = await supabase.from('portfolio_comentarios')
        .select('foto_id, autor_tipo, criado_at')
        .eq('projeto_id', projId)
        .order('criado_at', { ascending: false })

      const cMap = {}
      const fotosProcessadas = new Set()
      todasMsgs?.forEach(m => {
        if (!fotosProcessadas.has(m.foto_id)) {
          if (m.autor_tipo === 'cliente') cMap[m.foto_id] = true
          fotosProcessadas.add(m.foto_id)
        }
      })
      setFotosComentarios(cMap)
    }
  }, [])

  useEffect(() => {
    if (projetoExistente) {
      setProjetoId(projetoExistente.id)
      setTitulo(projetoExistente.titulo)
      setClienteWhatsapp(formatarTelefone(projetoExistente.cliente_whatsapp)) // Aplica máscara ao carregar
      if (projetoExistente.cliente_nome) setClienteNome(projetoExistente.cliente_nome)
      buscarDadosCliente(projetoExistente.cliente_whatsapp)
      carregarProgresso(projetoExistente.id)
    }
  }, [projetoExistente, carregarProgresso, buscarDadosCliente])

  useEffect(() => {
    if (whatsappValido && !projetoExistente) buscarDadosCliente(clienteWhatsapp)
  }, [clienteWhatsapp, whatsappValido, buscarDadosCliente, projetoExistente])

  const abrirChat = (n) => {
    setChatAberto(n)
    if (fotosData[n]) setFotosComentarios(prev => ({ ...prev, [fotosData[n].id]: false }))
  }

  async function buscarMensagens(fotoId) {
    const { data } = await supabase.from('portfolio_comentarios').select('*').eq('foto_id', fotoId).order('criado_at', { ascending: true })
    if (data) setHistoricoChat(data)
  }

  useEffect(() => {
    if (chatAberto && fotosData[chatAberto]) buscarMensagens(fotosData[chatAberto].id)
  }, [chatAberto])

  const enviarResposta = async () => {
    if (!novoComentario.trim() || enviandoComentario) return
    setEnviandoComentario(true)
    try {
      await supabase.from('portfolio_comentarios').insert({
        foto_id: fotosData[chatAberto].id, projeto_id: projetoId, autor_tipo: 'prestador', texto: novoComentario.trim()
      })
      setNovoComentario(''); buscarMensagens(fotosData[chatAberto].id)
    } catch (e) { alert("Erro ao enviar") } finally { setEnviandoComentario(false) }
  }

  const handleUpload = async (e, ordem) => {
    const file = e.target.files[0]; if (!file) return;
    setLoading(true)
    try {
      const { id } = await garantirProjetoNoBanco()
      const path = `${prestadorId}/${id}/${ordem}.jpg`
      await supabase.storage.from('portfolios').upload(path, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('portfolios').getPublicUrl(path)
      const { data: fotoDB } = await supabase.from('portfolio_fotos').upsert({ 
        projeto_id: id, url_foto: publicUrl, ordem, legenda: getEtapaLabel(ordem)
      }, { onConflict: 'projeto_id, ordem' }).select().single()
      setFotosUrls(prev => ({ ...prev, [ordem]: `${publicUrl}?t=${Date.now()}` }))
      setFotosData(prev => ({ ...prev, [ordem]: fotoDB }))
    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  const garantirProjetoNoBanco = async () => {
    if (projetoId) return { id: projetoId }
    const { data: proj, error } = await supabase.from('portfolio_projetos').insert({ 
      prestador_id: prestadorId, titulo, cliente_whatsapp: clienteWhatsapp.replace(/\D/g, ''), status: 'em_registro' 
    }).select('id').single()
    if (error) throw error
    setProjetoId(proj.id); return { id: proj.id }
  }

  return (
    <>
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden max-w-xl mx-auto font-sans">
        <div className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-4">
            
            {/* CARD TELEFONE - Ajustado */}
            <div className={`px-5 py-4 rounded-[2rem] border transition-all flex flex-col justify-between relative min-h-[90px] ${whatsappValido ? 'bg-blue-50/20 border-blue-100' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
              
              {/* Topo: Avatar e Nome */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {clienteFoto ? <img src={clienteFoto} className="w-full h-full object-cover" /> : <User size={14} className="text-slate-300" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase text-slate-400 leading-none mb-0.5">Cliente</span>
                  <span className="text-[11px] font-black text-slate-900 truncate leading-tight">
                    {clienteNome || (clienteWhatsapp.length > 5 ? 'Não localizado' : '...')}
                  </span>
                </div>
              </div>

              {/* Base: Input e Botão Ligar */}
              <div className="flex items-center gap-2 mt-2">
                <Smartphone size={14} className="text-slate-400 shrink-0" />
                <input 
                  className="w-full bg-transparent font-black text-blue-600 placeholder:text-slate-300 outline-none text-xs md:text-sm tracking-tight" // Fonte diminuída
                  placeholder="(00) 00000-0000" 
                  type="tel" 
                  maxLength={15}
                  value={clienteWhatsapp} 
                  onChange={handlePhoneChange} // Usa a função com máscara
                  disabled={projetoId && fotosUrls[1]} 
                />
                
                {/* Botão de Ligar (Só aparece se válido) */}
                {whatsappValido && (
                  <a 
                    href={`tel:${clienteWhatsapp.replace(/\D/g, '')}`} 
                    className="p-2 bg-green-500 text-white rounded-full shadow-md hover:scale-110 transition-transform active:scale-90"
                    title="Ligar para o cliente"
                  >
                    <Phone size={12} fill="currentColor" />
                  </a>
                )}
              </div>
            </div>
            
            <div className={`px-5 py-4 rounded-[2rem] border transition-all flex flex-col justify-center ${tituloValido ? 'bg-blue-50/20 border-blue-100' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
              <label className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2 italic"><Briefcase size={10} /> Descrição do Serviço</label>
              <input className="w-full bg-transparent font-black text-slate-900 placeholder:text-slate-300 outline-none text-sm" placeholder="Ex: Reforma Banheiro" value={titulo} onChange={e => setTitulo(e.target.value)} disabled={projetoId && fotosUrls[1]} />
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-6 transition-all duration-500 ${tituloValido ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
            {[1, 2, 3].map((n) => {
              const hasPhoto = !!fotosUrls[n];
              const temComent = fotosData[n] && fotosComentarios[fotosData[n].id];
              return (
                <div key={n} className={`rounded-[2.5rem] border border-slate-100 p-4 flex items-center gap-5 transition-all ${hasPhoto ? 'bg-white shadow-sm' : 'bg-slate-50/50'}`}>
                  <div className="relative w-24 h-24 shrink-0">
                    {hasPhoto ? (
                      <img src={fotosUrls[n]} className="w-full h-full object-cover rounded-[1.5rem]" />
                    ) : (
                      <div className="w-full h-full rounded-[1.5rem] flex items-center justify-center bg-white border-2 border-slate-100 text-blue-600 relative active:scale-95 transition-transform">
                        <Camera size={28} />
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleUpload(e, n)} />
                      </div>
                    )}
                    {hasPhoto && <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full border-4 border-white shadow-sm"><Check size={12} strokeWidth={4}/></div>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-slate-400">Etapa {n}</p>
                    <h4 className="text-xl font-black italic uppercase text-slate-800 tracking-tighter mb-3 leading-none">{getEtapaLabel(n)}</h4>
                    {hasPhoto && (
                      <div className="flex gap-2">
                        <button onClick={() => setZoomFoto(fotosUrls[n])} className="flex-1 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase text-slate-600 border border-slate-100 hover:bg-slate-100 transition-colors">Ver</button>
                        <button onClick={() => abrirChat(n)} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${temComent ? 'bg-blue-600 text-white shadow-lg animate-pulse' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                          <MessageSquare size={12}/> {temComent ? 'Ideia Nova!' : 'Mensagens'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {chatAberto && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom-10 duration-300">
          <div className="p-6 border-b flex items-center justify-between bg-white shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-slate-100"><img src={fotosUrls[chatAberto]} className="w-full h-full object-cover" /></div>
              <div>
                <h3 className="font-black uppercase italic text-slate-900 tracking-tighter leading-none">{getEtapaLabel(chatAberto)}</h3>
                <div className="flex items-center gap-1 mt-1 text-green-500 font-bold text-[10px] uppercase"><CheckCircle2 size={10}/> Canal Seguro</div>
              </div>
            </div>
            <button onClick={() => setChatAberto(null)} className="p-4 bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"><X size={24} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {historicoChat.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.autor_tipo === 'prestador' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white shadow-sm mt-auto bg-white flex items-center justify-center">
                  {msg.autor_tipo === 'prestador' ? <User size={14} className="text-slate-300"/> : (clienteFoto ? <img src={clienteFoto} className="w-full h-full object-cover"/> : <User size={14} className="text-slate-300"/>)}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.autor_tipo === 'prestador' ? 'items-end' : 'items-start'}`}>
                  <span className={`text-[8px] font-black uppercase mb-1 px-1 ${msg.autor_tipo === 'prestador' ? 'text-slate-400' : 'text-blue-600'}`}>
                    {msg.autor_tipo === 'prestador' ? 'Você' : (clienteNome.split(' ')[0] || 'Cliente')}
                  </span>
                  <div className={`p-4 rounded-3xl text-sm font-bold shadow-sm ${msg.autor_tipo === 'prestador' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                    {msg.texto}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t flex gap-3 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <input className="flex-1 bg-slate-100 rounded-3xl px-6 py-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400" placeholder="Responder para o cliente..." value={novoComentario} onChange={e => setNovoComentario(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarResposta()}/>
            <button onClick={enviarResposta} disabled={enviandoComentario || !novoComentario.trim()} className="p-5 bg-blue-600 text-white rounded-3xl shadow-xl active:scale-95 transition-all">
              {enviandoComentario ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
            </button>
          </div>
        </div>
      )}

      {zoomFoto && (
        <div className="fixed inset-0 z-[120] bg-black/95 flex items-center justify-center p-5" onClick={() => setZoomFoto(null)}>
          <img src={zoomFoto} className="max-w-full max-h-[85vh] rounded-[3rem] shadow-2xl border-4 border-white/10" />
        </div>
      )}
    </>
  )
}
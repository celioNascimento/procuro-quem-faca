'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Smartphone, Briefcase, Camera, Send, Check, X, Maximize2, User, Loader2, Star } from 'lucide-react'

export default function UploadWizard({ prestadorId, projetoExistente = null, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [projetoId, setProjetoId] = useState(projetoExistente?.id || null)
  const [tokenAvaliacao, setTokenAvaliacao] = useState(projetoExistente?.avaliacao_token || null)
  const [titulo, setTitulo] = useState(projetoExistente?.titulo || '')
  const [clienteWhatsapp, setClienteWhatsapp] = useState(projetoExistente?.cliente_whatsapp || '')
  const [clienteNome, setClienteNome] = useState(projetoExistente?.cliente_nome || '')
  const [prestadorWhatsapp, setPrestadorWhatsapp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const [conviteEnviado, setConviteEnviado] = useState(false)
  const [fotosUrls, setFotosUrls] = useState({ 1: null, 2: null, 3: null })
  const [zoomFoto, setZoomFoto] = useState(null)

  const dadosClienteValidos = clienteWhatsapp.replace(/\D/g, '').length >= 11 && clienteNome.trim().length > 2 && !errorMsg
  const tituloValido = titulo.trim().length > 3

  const getEtapaLabel = (n) => {
    if (n === 1) return "Início"
    if (n === 2) return "Execução"
    return "Conclusão"
  }

  useEffect(() => {
    if (projetoExistente) {
      setProjetoId(projetoExistente.id)
      setTokenAvaliacao(projetoExistente.avaliacao_token)
      setTitulo(projetoExistente.titulo)
      setClienteWhatsapp(projetoExistente.cliente_whatsapp)
      setClienteNome(projetoExistente.cliente_nome || '')
      const fMap = { 1: null, 2: null, 3: null }
      if (projetoExistente.portfolio_fotos) {
        projetoExistente.portfolio_fotos.forEach(f => fMap[f.ordem] = f.url_foto)
        setFotosUrls(fMap)
        if (fMap[1]) setConviteEnviado(true)
      }
    }
  }, [projetoExistente])

  useEffect(() => {
    async function getInfo() {
      try {
        const { data } = await supabase.from('prestadores').select('whatsapp').eq('id', prestadorId).single()
        if (data) setPrestadorWhatsapp(data.whatsapp?.replace(/\D/g, ''))
      } catch (e) { console.error("Erro prestador:", e) }
    }
    getInfo()
  }, [prestadorId])

  const registrarLogAtividade = async (acao, detalhes = {}) => {
    try {
      await supabase.from('logs_atividades').insert([{
        entidade_id: String(prestadorId),
        entidade_tipo: 'prestador',
        acao: acao,
        detalhes: {
          projeto_id: projetoId,
          titulo: titulo,
          cliente: clienteNome,
          ...detalhes
        }
      }])
    } catch (e) { console.error("Erro ao registrar log:", e) }
  }

  const handleFinalizarEEnviarWA = async () => {
    setLoading(true)
    try {
      // 1. Atualiza Status no Banco
      await supabase.from('portfolio_projetos')
        .update({ status: 'finalizado' })
        .eq('id', projetoId)

      // 2. Registra o Log de Conclusão (Monitoramento)
      await registrarLogAtividade('PROJETO_CONCLUIDO_WIZARD')

      // 3. Prepara o Link e Mensagem de Avaliação
      const linkAvaliacao = `${window.location.origin}/avaliar/${projetoId}?token=${tokenAvaliacao}`
      const msg = `Olá ${clienteNome.split(' ')[0]}! Finalizei o serviço de *${titulo}* ✅. Ficou excelente! Gostaria de pedir um segundo do seu tempo para avaliar meu trabalho aqui: ${linkAvaliacao}. Sua opinião me ajuda muito!`
      
      // 4. Abre o WhatsApp
      window.open(`https://wa.me/${clienteWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')

      // 5. Fecha o Wizard
      onComplete()
    } catch (err) {
      alert("Erro ao finalizar: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const recuperarProjeto = useCallback(async (whatsapp) => {
    const numLimpo = whatsapp.replace(/\D/g, '')
    if (numLimpo.length < 11) return
    setLoading(true)
    try {
      const { data } = await supabase.from('portfolio_projetos')
        .select(`*, portfolio_fotos(*)`)
        .eq('cliente_whatsapp', numLimpo)
        .eq('prestador_id', prestadorId)
        .neq('status', 'finalizado')
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle()

      if (data) {
        setProjetoId(data.id)
        setTokenAvaliacao(data.avaliacao_token)
        setTitulo(data.titulo)
        setClienteNome(data.cliente_nome || '')
        const fMap = { 1: null, 2: null, 3: null }
        data.portfolio_fotos.forEach(f => fMap[f.ordem] = f.url_foto)
        setFotosUrls({...fMap})
        if (fMap[1]) setConviteEnviado(true) 
      }
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [prestadorId])

  const handleWhatsappChange = (e) => {
    const input = e.target.value
    const numLimpo = input.replace(/\D/g, "").substring(0, 11)
    let formatado = numLimpo
    if (numLimpo.length > 2) formatado = `(${numLimpo.substring(0,2)}) ${numLimpo.substring(2)}`
    if (numLimpo.length > 7) formatado = `(${numLimpo.substring(0,2)}) ${numLimpo.substring(2,7)}-${numLimpo.substring(7)}`
    
    if (numLimpo === prestadorWhatsapp && numLimpo.length >= 10) setErrorMsg("Use o número do cliente!")
    else setErrorMsg("")
    
    setClienteWhatsapp(formatado)
    if (numLimpo.length === 11 && !errorMsg) recuperarProjeto(numLimpo)
  }

  const garantirProjetoNoBanco = async () => {
    if (projetoId) return { id: projetoId, token: tokenAvaliacao }
    const { data: proj, error } = await supabase.from('portfolio_projetos').insert({ 
      prestador_id: prestadorId, 
      titulo, 
      cliente_whatsapp: clienteWhatsapp.replace(/\D/g, ''),
      cliente_nome: clienteNome,
      status: 'em_registro' 
    }).select('id, avaliacao_token').single()
    if (error) throw error
    setProjetoId(proj.id); setTokenAvaliacao(proj.avaliacao_token)
    return { id: proj.id, token: proj.avaliacao_token }
  }

  const handleUpload = async (e, ordem) => {
    const file = e.target.files[0]; if (!file) return;
    setLoading(true)
    try {
      const { id } = await garantirProjetoNoBanco()
      const path = `${prestadorId}/${id}/${ordem}.jpg`
      await supabase.storage.from('portfolios').upload(path, file, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('portfolios').getPublicUrl(path)
      await supabase.from('portfolio_fotos').upsert({ projeto_id: id, url_foto: publicUrl, ordem, legenda: getEtapaLabel(ordem) }, { onConflict: 'projeto_id, ordem' })
      setFotosUrls(prev => ({ ...prev, [ordem]: `${publicUrl}?t=${Date.now()}` }))
      
      // Log de Upload (Monitorar progresso do portfólio)
      await registrarLogAtividade('FOTO_ADICIONADA', { ordem })

    } catch (err) { alert(err.message) } finally { setLoading(false) }
  }

  return (
    <>
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden max-w-xl mx-auto">
        <div className="p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-3xl border transition-all duration-300 ${clienteWhatsapp.length >= 11 ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
              <label className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                <Smartphone size={10} /> WhatsApp
              </label>
              <input 
                className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm"
                placeholder="(00) 00000-0000"
                type="tel" value={clienteWhatsapp} onChange={handleWhatsappChange}
                disabled={projetoId && fotosUrls[1]}
              />
            </div>
            <div className={`p-4 rounded-3xl border transition-all duration-300 ${clienteNome.length > 2 ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
              <label className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
                <User size={10} /> Nome do Cliente
              </label>
              <input 
                className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm placeholder-slate-300"
                placeholder="Ex: João Silva"
                value={clienteNome} onChange={e => setClienteNome(e.target.value)}
                disabled={projetoId && fotosUrls[1]}
              />
            </div>
          </div>

          <div className={`p-4 rounded-3xl border transition-all duration-300 ${tituloValido ? 'bg-blue-50/30 border-blue-100 shadow-md' : 'bg-slate-50 border-slate-100 opacity-50 pointer-events-none'}`}>
            <label className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-2">
              <Briefcase size={10} /> O que está sendo feito?
            </label>
            <input 
              className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm"
              placeholder="Ex: Instalação de Ar Condicionado"
              value={titulo} onChange={e => setTitulo(e.target.value)}
              disabled={projetoId && fotosUrls[1]}
            />
          </div>

          <div className={`transition-all duration-500 ${tituloValido && dadosClienteValidos ? 'opacity-100' : 'opacity-10 pointer-events-none'}`}>
            <div className="flex items-center gap-4 mb-4 px-2">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] italic">Timeline do Trabalho</p>
              <div className="h-[1px] flex-1 bg-slate-50" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((n) => {
                const isDisabled = (n === 1 && fotosUrls[1]) || (n > 1 && !fotosUrls[1]) || (n > 1 && !conviteEnviado);
                const hasPhoto = !!fotosUrls[n];
                return (
                  <div key={n} className="relative aspect-square group">
                    <div onClick={() => hasPhoto && setZoomFoto(fotosUrls[n])} className={`w-full h-full rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer ${hasPhoto ? 'border-blue-500 bg-white shadow-lg scale-[1.02]' : isDisabled ? 'border-slate-50 bg-slate-50/30 opacity-40' : 'border-slate-200 bg-slate-50 shadow-inner hover:bg-slate-100'}`}>
                      {hasPhoto ? (
                        <>
                          <img src={fotosUrls[n]} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                            <Maximize2 size={16} className="text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </>
                      ) : (
                        <div className={`flex flex-col items-center gap-1 ${!isDisabled ? 'text-slate-400' : 'text-slate-200'}`}>
                          <Camera size={20} strokeWidth={2.5} />
                        </div>
                      )}
                      <div className={`absolute bottom-0 left-0 right-0 py-2 text-center transition-all ${hasPhoto ? 'bg-blue-600/90 backdrop-blur-sm' : 'bg-white/40'}`}>
                        <span className={`text-[7px] font-black uppercase tracking-[0.15em] ${hasPhoto ? 'text-white' : 'text-slate-400'}`}>{getEtapaLabel(n)}</span>
                      </div>
                    </div>
                    {!hasPhoto && !isDisabled && <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" onChange={e => handleUpload(e, n)} />}
                    {hasPhoto && <div className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full p-1 shadow-xl z-20 animate-in zoom-in"><Check size={10} strokeWidth={4} /></div>}
                  </div>
                );
              })}
            </div>
          </div>

          {fotosUrls[1] && !conviteEnviado && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white flex items-center justify-between gap-5 animate-in slide-in-from-top-4 shadow-xl">
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Humanize o atendimento</p>
                <p className="text-xs font-bold leading-snug tracking-tight">Envie o link de acompanhamento para o(a) {clienteNome.split(' ')[0]}.</p>
              </div>
              <button 
                onClick={() => {
                  const link = `${window.location.origin}/avaliar/${projetoId}?token=${tokenAvaliacao}`
                  const msg = `Olá ${clienteNome.split(' ')[0]}! Iniciei seu serviço de *${titulo}*. Você pode acompanhar as fotos por aqui: ${link}`
                  window.open(`https://wa.me/${clienteWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                  setConviteEnviado(true)
                  registrarLogAtividade('LINK_ACOMPANHAMENTO_ENVIADO')
                }}
                className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
              >
                Enviar Link <Send size={10} className="inline ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* FOOTER: CONCLUIR E SOLICITAR AVALIAÇÃO */}
        <div className={`p-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 transition-all ${fotosUrls[3] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button 
            onClick={handleFinalizarEEnviarWA}
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Concluir e Pedir Avaliação
                <Star size={14} className="fill-white" />
              </>
            )}
          </button>
          <p className="text-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-4 italic px-4">
            O projeto será finalizado e o WhatsApp do cliente será aberto para avaliação.
          </p>
        </div>
      </div>

      {zoomFoto && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl p-4 flex flex-col items-center justify-center animate-in fade-in duration-300" onClick={() => setZoomFoto(null)}>
          <button className="absolute top-10 right-6 p-4 bg-white rounded-full text-slate-800 shadow-xl border border-slate-100 active:scale-90 transition-transform"><X size={24} /></button>
          <div className="w-full max-w-lg">
            <img src={zoomFoto} className="w-full rounded-[2.5rem] shadow-2xl border-8 border-white" alt="Zoom" />
          </div>
        </div>
      )}
    </>
  )
}
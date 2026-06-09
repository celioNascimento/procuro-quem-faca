import {
  Smartphone, Camera, X, Loader2, CheckCircle2, ChevronRight,
  Activity, AlertCircle, Link as LinkIcon, CloudCheck, RefreshCw,
} from 'lucide-react'
import { useUploadWizard } from '@/hooks/useUploadWizard'

interface Props {
  hookData: ReturnType<typeof useUploadWizard>
}

export function WizardForm({ hookData }: Props) {
  const {
    aguardandoAvaliacao, erroUpload, clienteWhatsapp, clienteNome, titulo,
    projetoId, projetosEncontrados, statusTitulo, fotosUrls, loadingEtapa,
    linkGerado, projetoStatus,
  } = hookData.state

  const {
    isProjetoConcluido, isSelfNumber, isPhoneValid, isTitleValid, isProjetoPendente, hasLegendaSalva
  } = hookData.derived

  const {
    setErroUpload, setClienteWhatsapp, setClienteNome, setTitulo, handleAtualizarTitulo,
    selecionarProjeto, setZoomEtapa, handleUpload, gerarLinkAceite, gerarLinkConclusao
  } = hookData.actions

  return (
    <div className="flex flex-col gap-5">

      {/* ── Banner aguardando avaliação ── */}
      {aguardandoAvaliacao && !isProjetoConcluido && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500">
          <Activity size={16} className="shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide leading-none mb-1">Serviço concluído</p>
            <p className="text-[11px] font-medium leading-snug">
              Envie o link de avaliação para <span className="font-black">{clienteNome || 'o cliente'}</span> confirmar e avaliar o trabalho.
            </p>
          </div>
          <button
            onClick={gerarLinkConclusao}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase px-3 py-2 rounded-xl transition-all active:scale-95 shadow-md"
          >
            Enviar
          </button>
        </div>
      )}

      {/* ── Banner de erro de upload ── */}
      {erroUpload && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[11px] font-black uppercase tracking-wide leading-none mb-1">Imagem não enviada</p>
            <p className="text-[11px] font-medium leading-snug">{erroUpload}</p>
          </div>
          <button onClick={() => setErroUpload(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gerenciar serviço</p>
        {projetoStatus && (
          <span className="text-[9px] font-black uppercase tracking-wide px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
            {projetoStatus.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* ── Campos ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* WhatsApp do cliente */}
        <div className={`p-3.5 rounded-2xl border transition-all ${isSelfNumber ? 'bg-red-50/50 border-red-200' : isPhoneValid ? 'bg-blue-50/30 border-blue-100' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Smartphone size={11} className={isSelfNumber ? 'text-red-400' : isPhoneValid ? 'text-blue-500' : 'text-slate-300'} />
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelfNumber ? 'text-red-400' : 'text-slate-400'}`}>
              {isSelfNumber ? 'Número inválido' : 'Whatsapp do cliente'}
            </span>
          </div>
          {projetoId ? (
            <span className="text-sm font-semibold text-slate-800 block">{clienteWhatsapp}</span>
          ) : (
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              className={`bg-transparent text-sm font-bold placeholder:text-slate-300 outline-none w-full ${isSelfNumber ? 'text-red-600' : 'text-slate-800'}`}
              value={clienteWhatsapp}
              onChange={e => setClienteWhatsapp(e.target.value)}
            />
          )}
          {isSelfNumber && (
            <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 mt-1.5 animate-in fade-in">
              <AlertCircle size={9} /> Não use o seu próprio número.
            </p>
          )}
        </div>

        {/* Nome do cliente */}
        <div className={`p-3.5 rounded-2xl border transition-all ${!isPhoneValid ? 'opacity-50 grayscale bg-slate-50' : 'bg-white border-slate-100'}`}>
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Nome do cliente</span>
          {projetoId ? (
            <span className="text-sm font-black text-slate-800 uppercase italic truncate block">{clienteNome}</span>
          ) : (
            <input
              type="text"
              placeholder="Ex: João Silva"
              disabled={!isPhoneValid}
              className="bg-transparent text-sm font-black text-slate-800 uppercase italic placeholder:text-slate-300 outline-none w-full"
              value={clienteNome}
              onChange={e => setClienteNome(e.target.value)}
            />
          )}
        </div>

        {/* Título do projeto */}
        <div className={`col-span-2 p-3.5 rounded-2xl border transition-all ${!isPhoneValid ? 'opacity-50 grayscale bg-slate-50' : 'bg-white border-slate-100 focus-within:border-blue-200'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Título do projeto</span>
            {projetoId && (
              <div className="flex items-center gap-1 animate-in fade-in duration-300">
                {statusTitulo === 'salvando' && (
                  <>
                    <RefreshCw size={9} className="animate-spin text-blue-500" />
                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Sincronizando...</span>
                  </>
                )}
                {statusTitulo === 'salvo' && (
                  <>
                    <CloudCheck size={10} className="text-green-500" />
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Salvo</span>
                  </>
                )}
              </div>
            )}
          </div>
          <input
            type="text"
            placeholder="Ex: Corte de cabelo, pintura sala, instalação..."
            disabled={!isPhoneValid}
            className="bg-transparent text-sm font-black text-slate-800 uppercase italic placeholder:text-slate-300 outline-none w-full"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            onBlur={handleAtualizarTitulo}
          />
        </div>
      </div>

      {/* ── Projetos encontrados ── */}
      {projetosEncontrados.length > 0 && !projetoId && (
        <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200 animate-in slide-in-from-top-4">
          <p className="text-[9px] font-black uppercase italic text-slate-400 mb-3 tracking-widest text-center">Projetos identificados</p>
          <div className="space-y-2">
            {projetosEncontrados.map(p => (
              <button
                key={p.id}
                onClick={() => selecionarProjeto(p)}
                className="w-full bg-white p-3.5 rounded-xl border border-slate-100 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-800 uppercase italic leading-none">{p.titulo}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Status: {p.status}</p>
                </div>
                <div className="flex items-center gap-1 text-blue-500 font-black text-[9px] uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">
                  Visualizar <ChevronRight size={12} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Etapas ── */}
      <div className="relative space-y-3 before:absolute before:left-[47px] before:top-12 before:bottom-12 before:w-px before:bg-slate-100 before:z-0">

        {/* Etapa 1 — Antes */}
        <div className={`relative z-10 flex items-center gap-4 p-2 rounded-2xl transition-all ${fotosUrls[1] ? 'bg-white border border-slate-100' : ''} ${!isTitleValid ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className={`shrink-0 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center overflow-hidden relative transition-all duration-300 ${fotosUrls[1] ? 'w-24 h-24 shadow-slate-200' : 'w-16 h-16 bg-slate-100/60 border-slate-200 hover:border-blue-200'}`}>
            {fotosUrls[1] ? (
              <img src={fotosUrls[1]!} onClick={() => setZoomEtapa(1)} className="w-full h-full object-cover cursor-pointer" alt="Fase 1" />
            ) : (
              <>
                <div className="flex flex-col items-center gap-1 text-blue-400/60">
                  {loadingEtapa[1] ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  <span className="text-[8px] font-black uppercase italic">Antes</span>
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 1)} disabled={loadingEtapa[1] || !isTitleValid} />
              </>
            )}
            {fotosUrls[1] && (
              <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <CheckCircle2 size={10} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${fotosUrls[1] ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {fotosUrls[1] ? 'Registrado' : 'Obrigatório'}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase italic">Etapa 1: Antes</span>
            </div>

            {isProjetoPendente && fotosUrls[1] && hasLegendaSalva(1) && (
              <button onClick={gerarLinkAceite} className="mt-1.5 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl shadow-md shadow-green-200 transition-all active:scale-95">
                <LinkIcon size={12} />
                <span className="text-[10px] font-black uppercase italic">Enviar WhatsApp</span>
              </button>
            )}

            {fotosUrls[1] && !hasLegendaSalva(1) && (
              <div className="mt-1.5 flex items-center gap-1.5 text-amber-600 animate-in fade-in duration-500">
                <AlertCircle size={10} className="shrink-0" />
                <span className="text-[8px] font-black uppercase italic">Adicione uma descrição</span>
              </div>
            )}

            {!fotosUrls[1] && isTitleValid && (
              <p className="text-[9px] font-black text-blue-500 uppercase italic mt-1 animate-pulse">Aguardando foto...</p>
            )}
          </div>
        </div>

        {/* Etapa 2 — Durante */}
        <div className={`relative z-10 flex items-center gap-4 p-2 rounded-2xl transition-all ${fotosUrls[2] ? 'bg-white border border-slate-100' : ''} ${!linkGerado ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
          <div className={`shrink-0 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center overflow-hidden relative transition-all duration-300 ${fotosUrls[2] ? 'w-24 h-24 shadow-slate-200' : 'w-16 h-16 bg-slate-100/60 border-slate-200 hover:border-blue-200'}`}>
            {fotosUrls[2] ? (
              <img src={fotosUrls[2]!} onClick={() => setZoomEtapa(2)} className="w-full h-full object-cover cursor-pointer" alt="Fase 2" />
            ) : (
              <>
                <div className="flex flex-col items-center gap-1 text-blue-400/60">
                  {loadingEtapa[2] ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  <span className="text-[8px] font-black uppercase italic">Durante</span>
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 2)} disabled={loadingEtapa[2] || !linkGerado} />
              </>
            )}
            {fotosUrls[2] && (
              <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <CheckCircle2 size={10} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${fotosUrls[2] ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {fotosUrls[2] ? 'Registrado' : 'Aguardando...'}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase italic">Etapa 2: Durante</span>
            </div>
            {!(projetoStatus?.toLowerCase() === 'finalizado' || fotosUrls[3]) && (
              <h4 className="text-xs font-semibold text-slate-600 italic mt-0.5">
                {isProjetoPendente ? 'Aguardando aceite' : (projetoStatus === 'em_execucao' || fotosUrls[2] ? 'Em andamento' : 'Aguardando...')}
              </h4>
            )}
            {fotosUrls[2] && !hasLegendaSalva(2) && (
              <div className="mt-1.5 flex items-center gap-1.5 text-amber-600 animate-in fade-in duration-500">
                <AlertCircle size={10} className="shrink-0" />
                <span className="text-[8px] font-black uppercase italic">Adicione uma descrição</span>
              </div>
            )}
          </div>
        </div>

        {/* Etapa 3 — Depois */}
        <div className={`relative z-10 flex items-center gap-4 p-2 rounded-2xl transition-all ${fotosUrls[3] ? 'bg-white border border-slate-100' : ''} ${!linkGerado ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
          <div className={`shrink-0 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center overflow-hidden relative transition-all duration-300 ${fotosUrls[3] ? 'w-24 h-24 shadow-slate-200' : 'w-16 h-16 bg-slate-100/60 border-slate-200 hover:border-blue-200'}`}>
            {fotosUrls[3] ? (
              <img src={fotosUrls[3]!} onClick={() => setZoomEtapa(3)} className="w-full h-full object-cover cursor-pointer" alt="Fase 3" />
            ) : (
              <>
                <div className="flex flex-col items-center gap-1 text-blue-400/60">
                  {loadingEtapa[3] ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                  <span className="text-[8px] font-black uppercase italic">Depois</span>
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e, 3)} disabled={loadingEtapa[3] || !linkGerado} />
              </>
            )}
            {fotosUrls[3] && (
              <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <CheckCircle2 size={10} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${fotosUrls[3] ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                {fotosUrls[3] ? 'Registrado' : 'Aguardando...'}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase italic">Etapa 3: Depois</span>
            </div>

            {fotosUrls[3] && hasLegendaSalva(3) && aguardandoAvaliacao && !isProjetoConcluido && (
              <button
                onClick={gerarLinkConclusao}
                className="mt-1.5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl shadow-md shadow-blue-100 transition-all active:scale-95"
              >
                <LinkIcon size={12} />
                <span className="text-[10px] font-black uppercase italic">Enviar para avaliar</span>
              </button>
            )}

            {isProjetoConcluido && (
              <div className="mt-1.5 flex items-center gap-1.5 text-green-600 animate-in fade-in duration-300">
                <CheckCircle2 size={10} className="shrink-0" />
                <span className="text-[8px] font-black uppercase italic">Avaliado pelo cliente</span>
              </div>
            )}

            {!fotosUrls[3] && (
              <h4 className="text-xs font-semibold text-slate-400 italic mt-0.5">Aguardando...</h4>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
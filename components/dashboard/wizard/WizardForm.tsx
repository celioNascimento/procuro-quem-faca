//dashboard/wizard/WizardForm.tsx 
 
import {
  Smartphone, Camera, X, Loader2, CheckCircle2, ChevronRight,
  Activity, AlertCircle, Link as LinkIcon, CloudCheck, RefreshCw,
} from 'lucide-react'
import { useUploadWizard } from '@/hooks/useUploadWizard'

interface Props {
  hookData: ReturnType<typeof useUploadWizard>
}

const ETAPAS = [
  { ordem: 1 as const, label: 'Antes',   sublabel: 'Estado inicial'  },
  { ordem: 2 as const, label: 'Durante', sublabel: 'Em andamento'    },
  { ordem: 3 as const, label: 'Depois',  sublabel: 'Resultado final' },
]

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

  const totalFotos = [fotosUrls[1], fotosUrls[2], fotosUrls[3]].filter(Boolean).length

  return (
    <div className="flex flex-col gap-4">

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

      {/* ── Banner erro upload ── */}
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

      {/* ── Card: dados do cliente ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex flex-col gap-4">

        {/* Status badge dentro do card — não corta */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dados do serviço</p>
          {projetoStatus && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${
              projetoStatus === 'em_execucao'
                ? 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
                : projetoStatus === 'finalizado'
                ? 'bg-green-50 text-green-600 border-green-100'
                : 'bg-yellow-50 text-yellow-600 border-yellow-100'
            }`}>
              {projetoStatus.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* WhatsApp */}
          <div className={`p-4 rounded-2xl border transition-all ${isSelfNumber ? 'bg-red-50/50 border-red-200' : isPhoneValid ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-1.5 mb-2">
              <Smartphone size={11} className={isSelfNumber ? 'text-red-400' : isPhoneValid ? 'text-blue-500' : 'text-slate-300'} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelfNumber ? 'text-red-400' : 'text-slate-400'}`}>
                {isSelfNumber ? 'Número inválido' : 'WhatsApp do cliente'}
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
              <p className="text-[9px] font-bold text-red-500 flex items-center gap-1 mt-2 animate-in fade-in">
                <AlertCircle size={9} /> Não use o seu próprio número.
              </p>
            )}
          </div>

          {/* Nome */}
          <div className={`p-4 rounded-2xl border transition-all ${!isPhoneValid ? 'opacity-50 grayscale bg-slate-50 border-slate-100' : 'bg-slate-50 border-slate-100'}`}>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Nome do cliente</span>
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
        </div>

        {/* Título */}
        <div className={`p-4 rounded-2xl border transition-all ${!isPhoneValid ? 'opacity-50 grayscale bg-slate-50 border-slate-100' : 'bg-slate-50 border-slate-100 focus-within:border-blue-200'}`}>
          <div className="flex items-center justify-between mb-2">
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
                className="w-full bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group"
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

      {/* ── Card: Linha do tempo ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-5">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Registro do Serviço
          </h3>
          <span className="text-[9px] font-medium text-slate-400">
            {totalFotos}/3 registros
          </span>
        </div>

        {/* Trilho vertical */}
        <div className="relative space-y-0">
          {ETAPAS.map((etapa, idx) => {
            const fotoUrl = fotosUrls[etapa.ordem]
            const concluida = !!fotoUrl
            const isLast = idx === ETAPAS.length - 1
            const isLoading = loadingEtapa[etapa.ordem]

            const bloqueada =
              etapa.ordem === 1 ? !isTitleValid :
              !linkGerado

            const isAtual = totalFotos === etapa.ordem - 1 && !bloqueada

            return (
              <div key={etapa.ordem} className="flex gap-4">

                {/* Coluna linha + nó */}
                <div className="flex flex-col items-center shrink-0 w-10">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                    concluida
                      ? 'bg-green-50 border-green-200'
                      : isAtual
                      ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200'
                      : 'bg-slate-50 border-dashed border-slate-200'
                  }`}>
                    {concluida ? (
                      <CheckCircle2 size={16} className="text-green-500" strokeWidth={2.5} />
                    ) : isAtual ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                    ) : (
                      <span className="text-[9px] font-black text-slate-300">{etapa.ordem}</span>
                    )}
                  </div>

                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[2rem] rounded-full my-1 transition-all duration-700 ${
                      concluida ? 'bg-blue-200' : 'bg-slate-100'
                    }`} />
                  )}
                </div>

                {/* Conteúdo */}
                <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''} ${bloqueada ? 'opacity-40 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-wide leading-none ${
                        concluida ? 'text-green-600' : isAtual ? 'text-blue-600' : 'text-slate-300'
                      }`}>
                        {etapa.label}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{etapa.sublabel}</p>
                    </div>

                    {/* Ações inline */}
                    {etapa.ordem === 1 && isProjetoPendente && concluida && hasLegendaSalva(1) && (
                      <button onClick={gerarLinkAceite} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-xl shadow-md shadow-green-200 transition-all active:scale-95">
                        <LinkIcon size={11} />
                        <span className="text-[9px] font-black uppercase italic">Enviar aceite</span>
                      </button>
                    )}

                    {etapa.ordem === 3 && concluida && hasLegendaSalva(3) && aguardandoAvaliacao && !isProjetoConcluido && (
                      <button onClick={gerarLinkConclusao} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl shadow-md shadow-blue-100 transition-all active:scale-95">
                        <LinkIcon size={11} />
                        <span className="text-[9px] font-black uppercase italic">Enviar avaliação</span>
                      </button>
                    )}
                  </div>

                  {/* Foto aspect-video ou placeholder clicável */}
                  <div className={`relative w-full rounded-2xl overflow-hidden border-2 transition-all group ${
                    concluida
                      ? 'border-green-100 shadow-sm hover:shadow-md cursor-pointer'
                      : isAtual
                      ? 'border-dashed border-blue-200 bg-blue-50/30 hover:border-blue-400 cursor-pointer'
                      : 'border-dashed border-slate-200 bg-slate-50'
                  }`}>
                    {concluida ? (
                      <>
                        <div className="aspect-video">
                          <img
                            src={fotoUrl!}
                            onClick={() => setZoomEtapa(etapa.ordem)}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            alt={etapa.label}
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                          <span className="text-white text-[10px] font-black uppercase tracking-widest">
                            Ampliar foto
                          </span>
                        </div>
                        {!hasLegendaSalva(etapa.ordem) && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/90 text-white px-2 py-1 rounded-full">
                            <AlertCircle size={9} />
                            <span className="text-[8px] font-black uppercase">Sem descrição</span>
                          </div>
                        )}
                        {isProjetoConcluido && etapa.ordem === 3 && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 text-white px-2 py-1 rounded-full">
                            <CheckCircle2 size={9} />
                            <span className="text-[8px] font-black uppercase">Avaliado</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <label className={`aspect-video flex flex-col items-center justify-center gap-2 ${!bloqueada ? 'cursor-pointer' : ''}`}>
                        <div className="flex flex-col items-center gap-2">
                          {isLoading
                            ? <Loader2 size={28} className="animate-spin text-blue-400" />
                            : <Camera size={28} className={isAtual ? 'text-blue-400' : 'text-slate-300'} />
                          }
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isAtual ? 'text-blue-500' : 'text-slate-300'}`}>
                            {isLoading ? 'Enviando...' : isAtual ? 'Toque para registrar' : 'Aguardando registro'}
                          </span>
                        </div>
                        {!bloqueada && (
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUpload(e, etapa.ordem)}
                            disabled={isLoading}
                          />
                        )}
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Instrução contextual */}
        <p className="text-center text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-50">
          {totalFotos === 0
            ? 'Preencha os dados acima e registre a foto inicial.'
            : totalFotos === 3
            ? 'Todos os registros enviados. Solicite a avaliação do cliente.'
            : `${3 - totalFotos} registro${3 - totalFotos > 1 ? 's' : ''} pendente${3 - totalFotos > 1 ? 's' : ''}.`
          }
        </p>
      </div>

    </div>
  )
}
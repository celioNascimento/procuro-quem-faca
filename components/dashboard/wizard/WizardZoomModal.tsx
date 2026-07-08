//dashboard/wizard/WizardZoomModal.tsx

import { Camera, X, Loader2, User, MessageSquare, AlertCircle } from 'lucide-react'
import { useUploadWizard } from '@/hooks/useUploadWizard'
import { ModalFotoBase } from '@/components/shared/ModalFotoBase'

interface Props {
  hookData: ReturnType<typeof useUploadWizard>
}

export function WizardZoomModal({ hookData }: Props) {
  const {
    zoomEtapa, fotosUrls, fotosData, erroUpload, comentariosZoom,
    legendaEdit, loadingEtapa, salvandoLegenda, erroLegenda,
  } = hookData.state

  const { isProjetoConcluido, canCloseZoom, hasLegendaSalva } = hookData.derived

  const {
    setZoomEtapa, setErroUpload, setLegendaEdit,
    handleUpload, handleSalvarLegenda, handleZoomClose,
  } = hookData.actions

  if (!zoomEtapa) return null

  return (
    <ModalFotoBase
      fotoUrl={fotosUrls[zoomEtapa]!}
      ordemLabel={`Registro 0${zoomEtapa}`}
      onClose={() => setZoomEtapa(null)}
    >
      {/* ── Cabeçalho ── */}
      <div className="p-6 md:p-10 pb-6 shrink-0 border-b border-slate-50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
          <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">
            Descrição desta fase
          </h3>
        </div>

        <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100/50">
          {erroUpload && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-3 animate-in fade-in duration-300">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-snug flex-1">{erroUpload}</p>
              <button onClick={() => setErroUpload(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={12} />
              </button>
            </div>
          )}

          {!isProjetoConcluido && comentariosZoom.length === 0 ? (
            <div className="flex flex-col gap-3">
              <textarea
                value={legendaEdit}
                onChange={(e) => setLegendaEdit(e.target.value)}
                placeholder="Adicione a descrição para esta fase..."
                className="w-full bg-white border border-blue-100 rounded-xl p-3 text-xs font-medium italic text-slate-600 outline-none focus:border-blue-300 resize-none custom-scrollbar"
                rows={3}
              />

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => handleUpload(e, zoomEtapa)}
                    disabled={loadingEtapa[zoomEtapa]}
                  />
                  <button className="w-full text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                    {loadingEtapa[zoomEtapa]
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Camera size={12} />}
                    <span className="truncate">
                      {loadingEtapa[zoomEtapa] ? 'Enviando...' : 'Trocar Foto'}
                    </span>
                  </button>
                </div>
                <button
                  onClick={handleSalvarLegenda}
                  disabled={
                    salvandoLegenda ||
                    legendaEdit.trim() === '' ||
                    legendaEdit === (fotosData[zoomEtapa]?.legenda || '')
                  }
                  className="flex-[1.5] text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {salvandoLegenda ? 'Salvando...' : 'Salvar Descrição'}
                </button>
              </div>

              {erroLegenda && (
                <p className="text-[9px] text-red-500 font-bold">{erroLegenda}</p>
              )}

              {!hasLegendaSalva(zoomEtapa) && (
                <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-amber-700 leading-tight uppercase tracking-tight">
                    {zoomEtapa === 1
                      ? 'Adicione uma descrição para liberar o envio do link ao cliente.'
                      : 'Adicione uma descrição para esta foto antes de fechar.'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs font-medium italic text-slate-600 leading-relaxed">
              {fotosData[zoomEtapa]?.legenda || 'Nenhuma nota técnica registrada.'}
            </p>
          )}
        </div>
      </div>

      {/* ── Comentários ── */}
      <div className="flex-1 overflow-y-auto space-y-4 p-6 md:p-10 pt-6 pr-8 custom-scrollbar">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-2">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
            Feedback do Cliente
          </h4>
          <MessageSquare size={12} className="text-slate-300" />
        </div>

        {comentariosZoom.length === 0 ? (
          <p className="text-[11px] text-slate-300 italic py-4 text-center">
            Nenhum comentário nesta etapa.
          </p>
        ) : (
          comentariosZoom.map((com) => (
            <div key={com.id} className="flex gap-3 animate-in slide-in-from-left-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 shrink-0 flex items-center justify-center border border-blue-100">
                <User size={14} className="text-blue-400" />
              </div>
              <div className="max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-tight bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100">
                {com.texto}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Botão fechar ── */}
      <div className="p-6 md:p-10 pt-0 shrink-0">
        <button
          onClick={handleZoomClose}
          className={`w-full py-5 rounded-[2rem] font-black uppercase italic text-[10px] tracking-widest transition-all active:scale-95 shadow-xl ${
            canCloseZoom
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {canCloseZoom ? 'Fechar Inspeção' : 'Legenda Obrigatória'}
        </button>
      </div>
    </ModalFotoBase>
  )
}
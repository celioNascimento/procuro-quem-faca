// components/dashboard/wizard/garantia/GarantiaZoomModal.tsx
//
// Modal de zoom para fotos de garantia — análogo ao WizardZoomModal, mas
// para o fluxo de garantia (useGarantiaWizard).
//
// Não usa ModalFotoBase porque as fotos de garantia precisam de FotoGarantia
// (resolução de URL assinada), enquanto ModalFotoBase renderiza <img src>
// direto. Mantém o mesmo layout visual de dois painéis.

'use client'

import { X, Camera, Loader2, MessageSquare, User, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { FotoGarantia } from './FotoGarantia'
import type { useGarantiaWizard } from '@/hooks/useGarantiaWizard'

interface Props {
  wizard: ReturnType<typeof useGarantiaWizard>
  podeEnviar: boolean
  autorTipo: 'cliente' | 'prestador'
}

export function GarantiaZoomModal({ wizard, podeEnviar, autorTipo }: Props) {
  const { state, derived, actions } = wizard

  if (!state.zoomFotoId) return null

  const foto = state.fotos.find((f) => f.id === state.zoomFotoId)
  if (!foto) return null

  const comentariosDaFoto = derived.comentariosDaFotoZoom
  const faseFoto = foto.fase === 'problema' ? 'Foto do problema' : 'Foto da resolução'
  const temNavegacao = state.fotos.length > 1

  // Ao navegar pelos slides, sincroniza zoomFotoId com a foto do slide atual
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    actions.prevSlide()
    const idx = state.fotos.findIndex((f) => f.id === state.zoomFotoId)
    const prev = state.fotos[(idx - 1 + state.fotos.length) % state.fotos.length]
    if (prev) actions.setZoomFotoId(prev.id)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    actions.nextSlide()
    const idx = state.fotos.findIndex((f) => f.id === state.zoomFotoId)
    const next = state.fotos[(idx + 1) % state.fotos.length]
    if (next) actions.setZoomFotoId(next.id)
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 flex items-center justify-center p-2 md:p-8 animate-in fade-in duration-300">

      {/* Botão fechar flutuante */}
      <button
        onClick={() => actions.setZoomFotoId(null)}
        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[210]"
      >
        <X size={32} />
      </button>

      <div className="flex flex-col md:flex-row bg-white rounded-[3rem] overflow-hidden w-full max-w-5xl h-full max-h-[90vh] shadow-2xl">

        {/* ── Painel esquerdo: foto ── */}
        <div className="flex-[1.5] shrink-0 max-h-[35vh] md:max-h-none md:h-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 opacity-80" />

          <FotoGarantia
            path={foto.url_foto}
            publica={foto.publica}
            className="relative z-10 max-w-full max-h-full object-contain"
            alt={faseFoto}
          />

          {/* Label da fase */}
          <div className="absolute top-6 left-6 bg-orange-600/90 px-4 py-2 rounded-full text-white text-[10px] font-black uppercase italic tracking-widest border border-orange-400/20 z-20">
            {faseFoto}
          </div>

          {/* Navegação entre fotos */}
          {temNavegacao && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-40">
              <button
                onClick={handlePrev}
                className="w-10 h-10 bg-white/10 hover:bg-white/90 rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 bg-white/10 hover:bg-white/90 rounded-full flex items-center justify-center text-white hover:text-slate-900 transition-all shadow-xl active:scale-90 border border-white/10"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* ── Painel direito ── */}
        <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden border-l border-slate-50">

          {/* Legenda / descrição */}
          <div className="p-6 md:p-8 pb-5 shrink-0 border-b border-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
              <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">
                Descrição desta foto
              </h3>
            </div>

            {state.erroUpload && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-3">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold leading-snug flex-1">{state.erroUpload}</p>
              </div>
            )}

            <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100/50">
              {podeEnviar ? (
                <div className="flex flex-col gap-3">
                  <textarea
                    value={state.legendaEdit}
                    onChange={(e) => actions.setLegendaEdit(e.target.value)}
                    placeholder="Adicione uma descrição para esta foto..."
                    className="w-full bg-white border border-orange-100 rounded-xl p-3 text-xs font-medium italic text-slate-600 outline-none focus:border-orange-300 resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-xl py-2 cursor-pointer hover:border-orange-200 transition-colors">
                      {state.enviandoFoto
                        ? <Loader2 size={12} className="animate-spin text-orange-400" />
                        : <Camera size={12} className="text-slate-400" />
                      }
                      <span className="text-[9px] font-black uppercase text-slate-400">
                        {state.enviandoFoto ? 'Enviando...' : 'Trocar foto'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => actions.handleUpload(e, foto.fase)}
                        disabled={state.enviandoFoto}
                      />
                    </label>
                    <button
                      onClick={actions.handleSalvarLegenda}
                      disabled={
                        state.salvandoLegenda ||
                        state.legendaEdit.trim() === '' ||
                        state.legendaEdit === (foto.legenda ?? '')
                      }
                      className="flex-[1.5] text-[9px] font-black uppercase tracking-widest bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                    >
                      {state.salvandoLegenda ? 'Salvando...' : 'Salvar descrição'}
                    </button>
                  </div>
                  {state.erroLegenda && (
                    <p className="text-[9px] text-red-500 font-bold">{state.erroLegenda}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-medium italic text-slate-600 leading-relaxed">
                  {foto.legenda || 'Nenhuma descrição registrada.'}
                </p>
              )}
            </div>
          </div>

          {/* Comentários desta foto */}
          <div className="flex-1 overflow-y-auto space-y-4 p-6 md:p-8 pt-5">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                Comentários
              </h4>
              <MessageSquare size={12} className="text-slate-300" />
            </div>

            {comentariosDaFoto.length === 0 ? (
              <p className="text-[11px] text-slate-300 italic py-4 text-center">
                Nenhum comentário nesta foto.
              </p>
            ) : (
              comentariosDaFoto.map((com) => (
                <div
                  key={com.id}
                  className={`flex gap-3 animate-in slide-in-from-left-2 ${
                    com.autor_tipo === autorTipo ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-50 shrink-0 flex items-center justify-center border border-slate-100">
                    <User size={14} className="text-slate-400" />
                  </div>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-bold leading-tight ${
                    com.autor_tipo === autorTipo
                      ? 'bg-orange-600 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                  }`}>
                    {com.texto}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Botão fechar */}
          <div className="p-6 md:p-8 pt-0 shrink-0">
            <button
              onClick={() => actions.setZoomFotoId(null)}
              className="w-full py-5 rounded-[2rem] font-black uppercase italic text-[10px] tracking-widest bg-slate-800 text-white hover:bg-slate-700 transition-all active:scale-95 shadow-xl"
            >
              Fechar inspeção
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

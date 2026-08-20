// components/dashboard/wizard/garantia/GarantiaCarrossel.tsx
//
// Carrossel de fotos do caso de garantia, separado por fase (problema/resolução).
// Reaproveitado por GarantiaAberta e GarantiaRespondida — a única diferença
// entre os dois contextos é se o upload está habilitado (podeEnviar).
//
// A fase da foto enviada é automática conforme autorTipo (ver useGarantiaWizard):
// cliente sempre envia 'problema', prestador sempre envia 'resolucao'.

'use client'

import { Camera, Loader2 } from 'lucide-react'
import type { useGarantiaWizard } from '@/hooks/useGarantiaWizard'
import { FotoGarantia } from './FotoGarantia'

interface Props {
  wizard: ReturnType<typeof useGarantiaWizard>
  podeEnviar: boolean
  autorTipo: 'cliente' | 'prestador'
}

export function GarantiaCarrossel({ wizard, podeEnviar, autorTipo }: Props) {
  const { state, actions } = wizard

  const fotosProblema = state.fotos.filter((f) => f.fase === 'problema')
  const fotosResolucao = state.fotos.filter((f) => f.fase === 'resolucao')

  const labelUpload = autorTipo === 'cliente' ? 'Anexar foto do problema' : 'Anexar foto da resolução'

  return (
    <div className="space-y-4">
      {fotosProblema.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
            Fotos do problema
          </p>
          <div className="grid grid-cols-3 gap-2">
            {fotosProblema.map((foto) => (
              <button
                key={foto.id}
                onClick={() => actions.setZoomFotoId(foto.id)}
                className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-100 hover:border-orange-200 transition-colors"
              >
                <FotoGarantia path={foto.url_foto} publica={foto.publica} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      )}

      {fotosResolucao.length > 0 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">
            Fotos da resolução
          </p>
          <div className="grid grid-cols-3 gap-2">
            {fotosResolucao.map((foto) => (
              <button
                key={foto.id}
                onClick={() => actions.setZoomFotoId(foto.id)}
                className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-green-100 hover:border-green-300 transition-colors"
              >
                <FotoGarantia path={foto.url_foto} publica={foto.publica} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      )}

      {podeEnviar && (
        <div>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl py-4 cursor-pointer hover:border-blue-300 transition-colors">
            {state.enviandoFoto ? (
              <Loader2 size={16} className="animate-spin text-blue-400" />
            ) : (
              <Camera size={16} className="text-slate-400" />
            )}
            <span className="text-[10px] font-bold uppercase text-slate-400">
              {state.enviandoFoto ? 'Enviando...' : labelUpload}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={actions.handleUpload}
              disabled={state.enviandoFoto}
            />
          </label>
          {state.erroUpload && (
            <p className="text-[10px] text-red-500 font-medium mt-1">{state.erroUpload}</p>
          )}
        </div>
      )}
    </div>
  )
}

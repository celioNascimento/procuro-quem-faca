//dashboard/wizard/WizardZoomModal.tsx
//
// Foto ampliada com a descrição e os comentários do cliente. É só para olhar: a descrição se edita
// no cartão da própria foto, e este modal sempre pode ser fechado.
import { MessageSquare, User } from 'lucide-react'
import type { useUploadWizard } from '@/hooks/useUploadWizard'
import { ModalFotoBase } from '@/components/shared/ModalFotoBase'
import { descricaoOuPadrao, NOME_DA_ETAPA, type EtapaFoto } from '@/lib/trabalho/descricaoFotos'

interface Props {
  hookData: ReturnType<typeof useUploadWizard>
}

export function WizardZoomModal({ hookData }: Props) {
  const { zoomEtapa, fotosUrls, fotosData, comentariosZoom } = hookData.state
  const { setZoomEtapa, handleZoomClose } = hookData.actions

  if (!zoomEtapa || !fotosUrls[zoomEtapa]) return null

  const nome = NOME_DA_ETAPA[zoomEtapa as EtapaFoto] ?? `Foto ${zoomEtapa}`
  const foto = fotosData[zoomEtapa]

  return (
    <ModalFotoBase fotoUrl={fotosUrls[zoomEtapa]!} ordemLabel={nome} onClose={() => setZoomEtapa(null)}>
      <div className="shrink-0 border-b border-slate-100 p-6 md:p-10 md:pb-6">
        <h3 className="text-lg font-black text-slate-900">{nome}</h3>
        <p className="mt-2 text-base leading-relaxed text-slate-700">
          {foto?.legenda?.trim() ? foto.legenda : <span className="text-slate-500">{descricaoOuPadrao(zoomEtapa, null)}. Sem descrição escrita.</span>}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-6 md:p-10 md:pt-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-sm font-bold text-slate-600">Comentários do cliente</h4>
          <MessageSquare size={16} className="text-slate-400" aria-hidden="true" />
        </div>
        {comentariosZoom.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Nenhum comentário nesta foto.</p>
        ) : (
          comentariosZoom.map((com) => (
            <div key={com.id} className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                <User size={16} className="text-blue-500" aria-hidden="true" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-100 bg-slate-50 p-3 text-sm font-medium leading-snug text-slate-700">{com.texto}</div>
            </div>
          ))
        )}
      </div>

      <div className="shrink-0 p-6 pt-0 md:p-10 md:pt-0">
        <button type="button" onClick={handleZoomClose} className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 text-base font-bold text-white transition-colors hover:bg-blue-700">
          Fechar
        </button>
      </div>
    </ModalFotoBase>
  )
}

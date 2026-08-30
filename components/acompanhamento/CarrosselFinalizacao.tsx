//components/acompanhamento/CarrosselFinalizacao.tsx

import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { FotoOrdenada, Avaliacao, Projeto } from '@/types/avaliacao'

type Props = {
  projeto: Projeto
  fotosCarrossel: FotoOrdenada[]
  currentSlide: number
  onNext: () => void
  onPrev: () => void
  avaliacaoExistente: Avaliacao | null
}

export default function CarrosselFinalizacao({
  projeto,
  fotosCarrossel,
  currentSlide,
  onNext,
  onPrev,
  avaliacaoExistente,
}: Props) {
  const fotoAtual = fotosCarrossel[currentSlide]
  // Fluxo sem_fotos (ou, defensivamente, qualquer projeto sem fotos
  // registradas): sem imagem para exibir no carrossel.
  const semFoto = fotosCarrossel.length === 0

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-5">
      {/* Card de foto — ou card de conclusão, quando não há fotos */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
        {/* Cabeçalho do card */}
        <div className="p-5 border-b border-slate-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 p-[2px]">
            <img
              src={projeto.prestadores?.foto_perfil}
              alt={projeto.prestadores?.nome}
              className="w-full h-full rounded-full object-cover border-2 border-white"
            />
          </div>
          <p className="text-xs font-black text-slate-800 uppercase">
            {projeto.prestadores?.nome}
          </p>
        </div>

        {!semFoto && (
          <div className="relative aspect-square bg-slate-50">
            <img
              src={fotoAtual?.url_foto}
              className="w-full h-full object-contain"
              alt={fotoAtual?.label}
            />

            {/* Badge de fase */}
            <div className="absolute top-5 right-5 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20">
              {fotoAtual?.label}
            </div>

            {/* Controles de navegação */}
            {fotosCarrossel.length > 1 && (
              <>
                <button
                  onClick={onPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full text-slate-900 shadow-xl active:scale-90 transition-all border border-slate-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full text-slate-900 shadow-xl active:scale-90 transition-all border border-slate-100"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Rodapé do card */}
        <div className="p-6 text-center bg-white">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            {projeto.titulo}
          </h4>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-[2px] w-8 bg-blue-100 rounded-full" />
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
              Entrega Finalizada
            </p>
            <div className="h-[2px] w-8 bg-blue-100 rounded-full" />
          </div>
        </div>
      </div>

      {/* Card de avaliação existente */}
      {avaliacaoExistente && (
        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-200 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={16} fill="white" className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Feedback do Cliente
              </span>
            </div>

            <div className="flex items-center gap-2">
              {avaliacaoExistente.indica && (
                <span className="flex items-center gap-1 bg-white/20 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/30">
                  ✦ Indico
                </span>
              )}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={10}
                    fill={avaliacaoExistente.nota >= s ? 'white' : 'transparent'}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="text-sm font-medium leading-relaxed opacity-90 italic">
            "{avaliacaoExistente.comentario || 'Serviço finalizado com sucesso.'}"
          </p>
        </div>
      )}
    </div>
  )
}

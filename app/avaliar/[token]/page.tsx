//avaliacao/[token]/page.tsx

'use client'
import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import { useAvaliar } from '@/hooks/useAvaliacao'
import HeaderCliente from '@/components/perfil/HeaderCliente'
import { CardPrestador } from '@/components/acompanhamento/CardPrestador'
import CarrosselFinalizacao from '@/components/acompanhamento/CarrosselFinalizacao'
import { BlocoAvaliacao } from '@/components/acompanhamento/BlocoAvaliacao'
import { RodapeSeguranca } from '@/components/acompanhamento/RodapeSeguranca'

export default function PaginaAvaliar({
  params: paramsPromise,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(paramsPromise)
  const router = useRouter()

  const {
    projeto, avaliacaoExistente, avaliacaoFinalizada,
    fotosCarrossel, currentSlide, nextSlide, prevSlide,
    loading, mounted,
    nota, setNota, hoverNota, setHoverNota,
    comentarioGeral, setComentarioGeral,
    indica, setIndica, submitting,
    handleFinalizarAvaliacao,
  } = useAvaliar(token)

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-bold text-slate-300 uppercase tracking-widest animate-pulse">
        Carregando avaliação...
      </div>
    )
  }

  if (!projeto) return null

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
      <HeaderCliente nomeCliente={projeto.cliente_nome} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-36 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">

          {/* Coluna esquerda — sticky */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-32 space-y-4">
            <CardPrestador projeto={projeto} />
            <RodapeSeguranca />
          </aside>

          {/* Coluna direita */}
          <div className="flex-1 min-w-0 space-y-5">

            <CarrosselFinalizacao
              projeto={projeto}
              fotosCarrossel={fotosCarrossel}
              currentSlide={currentSlide}
              onNext={nextSlide}
              onPrev={prevSlide}
              avaliacaoExistente={avaliacaoExistente}
            />

            {!avaliacaoFinalizada ? (
              <BlocoAvaliacao
                nota={nota}
                setNota={setNota}
                hoverNota={hoverNota}
                setHoverNota={setHoverNota}
                comentarioGeral={comentarioGeral}
                setComentarioGeral={setComentarioGeral}
                indica={indica}
                setIndica={setIndica}
                submitting={submitting}
                onSubmit={handleFinalizarAvaliacao}
              />
            ) : (
              // Depois de avaliado, a avaliação em si já foi concluída —
              // a próxima etapa relevante é o acompanhamento pós-serviço,
              // onde vive a opção de acionar garantia caso algo dê errado
              // depois. Substitui o BlocoAvaliacao (não faz sentido os dois
              // juntos: já avaliou, não há mais nota a dar aqui).
              <button
                onClick={() => router.push(`/acompanhamento/${token}`)}
                className="w-full bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center justify-between gap-4 hover:border-blue-200 hover:shadow-md transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-800 leading-none mb-1">
                      Acompanhamento e Garantia
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Teve algum problema depois do serviço? Acesse aqui.
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 shrink-0" />
              </button>
            )}

            <div className="lg:hidden">
              <RodapeSeguranca />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
